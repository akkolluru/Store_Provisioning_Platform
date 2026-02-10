import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface HelmInstallOptions {
    storeName: string;
    subdomain: string;
    engine: 'woocommerce' | 'medusa';
    domain?: string;
    environment?: 'local' | 'production';
}

export interface HelmReleaseStatus {
    name: string;
    namespace: string;
    status: 'deployed' | 'pending-install' | 'pending-upgrade' | 'failed' | 'unknown';
    chart: string;
    appVersion: string;
    updated: Date;
}

export class HelmService {
    private chartPath: string;
    private defaultDomain: string;

    constructor() {
        this.chartPath = './helm';
        this.defaultDomain = 'local';
    }

    /**
     * Install a new store using Helm
     */
    async installStore(options: HelmInstallOptions): Promise<{ namespace: string; url: string }> {
        const { storeName, subdomain, engine, domain = this.defaultDomain, environment = 'local' } = options;

        // Validate engine
        if (engine !== 'woocommerce' && engine !== 'medusa') {
            throw new Error(`Unsupported engine: ${engine}. Must be 'woocommerce' or 'medusa'`);
        }

        if (engine === 'medusa') {
            throw new Error('Medusa engine is not yet implemented. Please use woocommerce.');
        }

        const namespace = storeName;
        const fullDomain = `${subdomain}.${domain}`;
        const chartDir = `${this.chartPath}/${engine}`;
        const valuesFile = environment === 'production'
            ? `${chartDir}/values-prod.yaml`
            : `${chartDir}/values-local.yaml`;

        try {
            // Check if release already exists
            const exists = await this.releaseExists(storeName);
            if (exists) {
                throw new Error(`Store ${storeName} already exists. Use update instead.`);
            }

            // Install Helm chart into the store's own namespace
            const helmCommand = [
                'helm install',
                storeName,
                chartDir,
                `--namespace ${namespace}`,
                '--create-namespace',
                `--set storeName=${storeName}`,
                `--set storeSubdomain=${subdomain}`,
                `--set domain=${domain}`,
                `-f ${valuesFile}`,
                '--wait',
                '--timeout=10m'
            ].join(' ');

            console.log(`[HelmService] Installing store: ${helmCommand}`);

            const { stdout, stderr } = await execAsync(helmCommand);

            if (stderr && !stderr.includes('STATUS: deployed')) {
                console.warn(`[HelmService] Helm install warnings: ${stderr}`);
            }

            console.log(`[HelmService] Store ${storeName} installed successfully`);
            console.log(stdout);

            // Apply isolation policies after successful install
            console.log(`[HelmService] Applying isolation policies to namespace ${namespace}`);
            await this.applyIsolationPolicies(namespace);
            console.log(`[HelmService] Isolation policies applied successfully`);

            // Generate accessible URL based on environment
            const url = await this.generateStoreUrl(storeName, namespace, fullDomain, environment);

            return {
                namespace,
                url
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to install store ${storeName}:`, errorMessage);

            // Cleanup on failure
            try {
                await this.uninstallStore(storeName);
            } catch (cleanupError) {
                console.error(`[HelmService] Cleanup failed:`, cleanupError);
            }

            throw new Error(`Failed to provision store: ${errorMessage}`);
        }
    }

    /**
     * Generate an accessible URL for a store based on environment.
     * - Local: Uses NodePort service → http://<minikube-ip>:<node-port>
     * - Production: Uses Ingress hostname → https://<subdomain>.<domain>
     */
    private async generateStoreUrl(
        storeName: string,
        namespace: string,
        fullDomain: string,
        environment: string
    ): Promise<string> {
        if (environment !== 'local') {
            return `https://${fullDomain}`;
        }

        // Local: discover NodePort and Minikube IP for an immediately accessible URL
        const serviceName = `${storeName}-wordpress`;

        try {
            const getNodePortCmd = `kubectl get service ${serviceName} -n ${namespace} -o jsonpath='{.spec.ports[0].nodePort}'`;
            const { stdout: rawNodePort } = await execAsync(getNodePortCmd);
            const nodePort = rawNodePort.trim().replace(/'/g, '');

            if (!nodePort || nodePort === 'null') {
                throw new Error(`NodePort not assigned for service ${serviceName}`);
            }

            const { stdout: rawIP } = await execAsync('minikube ip');
            const minikubeIP = rawIP.trim();

            if (!minikubeIP) {
                throw new Error('Could not determine Minikube IP');
            }

            const url = `http://${minikubeIP}:${nodePort}`;
            console.log(`[HelmService] Store URL generated: ${url}`);
            return url;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to generate NodePort URL: ${errorMessage}`);
            // Fail with a clear error instead of silently returning a broken hostname
            throw new Error(
                `Store provisioned but URL generation failed: ${errorMessage}. ` +
                `Ensure the service ${serviceName} exists in namespace ${namespace} with type NodePort.`
            );
        }
    }

    /**
     * Uninstall a store
     */
    async uninstallStore(storeName: string): Promise<void> {
        try {
            const helmCommand = `helm uninstall ${storeName} --namespace ${storeName} --wait --timeout=5m`;

            console.log(`[HelmService] Uninstalling store: ${helmCommand}`);

            const { stdout } = await execAsync(helmCommand);
            console.log(`[HelmService] Store ${storeName} uninstalled successfully`);
            console.log(stdout);

            // Delete namespace (Helm doesn't delete namespaces it creates)
            try {
                await execAsync(`kubectl delete namespace ${storeName} --timeout=2m`);
                console.log(`[HelmService] Namespace ${storeName} deleted`);
            } catch (nsError: unknown) {
                const nsErrorMessage = nsError instanceof Error ? nsError.message : String(nsError);
                if (!nsErrorMessage.includes('not found')) {
                    console.warn(`[HelmService] Failed to delete namespace: ${nsErrorMessage}`);
                }
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to uninstall store ${storeName}:`, errorMessage);
            throw new Error(`Failed to delete store: ${errorMessage}`);
        }
    }

    /**
     * Get status of a Helm release
     */
    async getStoreStatus(storeName: string): Promise<HelmReleaseStatus> {
        try {
            const helmCommand = `helm status ${storeName} --output json`;
            const { stdout } = await execAsync(helmCommand);

            const status = JSON.parse(stdout);

            return {
                name: status.name,
                namespace: status.namespace,
                status: status.info.status.toLowerCase(),
                chart: status.chart.metadata.name,
                appVersion: status.chart.metadata.appVersion,
                updated: new Date(status.info.last_deployed)
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('not found')) {
                throw new Error(`Store ${storeName} not found`);
            }
            throw new Error(`Failed to get store status: ${errorMessage}`);
        }
    }

    /**
     * Check if a Helm release exists
     */
    async releaseExists(storeName: string): Promise<boolean> {
        try {
            await execAsync(`helm status ${storeName}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * List all deployed stores
     */
    async listStores(): Promise<HelmReleaseStatus[]> {
        try {
            const helmCommand = 'helm list --output json --all-namespaces';
            const { stdout } = await execAsync(helmCommand);

            const releases = JSON.parse(stdout);

            return releases
                .filter((r: { chart: string }) => r.chart.includes('woocommerce') || r.chart.includes('medusa'))
                .map((r: { name: string; namespace: string; status: string; chart: string; app_version: string; updated: string }) => ({
                    name: r.name,
                    namespace: r.namespace,
                    status: r.status.toLowerCase(),
                    chart: r.chart,
                    appVersion: r.app_version,
                    updated: new Date(r.updated)
                }));

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to list stores:`, errorMessage);
            return [];
        }
    }

    /**
     * Check if Helm is installed
     */
    async checkHelmInstalled(): Promise<boolean> {
        try {
            await execAsync('helm version');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Apply isolation policies (ResourceQuota, LimitRange, NetworkPolicies) to a namespace
     * This enforces resource limits and network security for each store
     */
    async applyIsolationPolicies(namespace: string): Promise<void> {
        const policyDir = path.join(process.cwd(), 'kubernetes', 'isolation');
        const policies = [
            'resource-quota.yaml',
            'limit-range.yaml',
            'network-policy-default-deny.yaml',
            'network-policy-allow-dns.yaml',
            'network-policy-woocommerce.yaml',
            'network-policy-mysql.yaml',
        ];

        try {
            for (const policyFile of policies) {
                const policyPath = path.join(policyDir, policyFile);

                // Check if policy file exists
                if (!fs.existsSync(policyPath)) {
                    console.warn(`[HelmService] Policy file not found: ${policyPath}`);
                    continue;
                }

                // Read policy template
                let policyYaml = fs.readFileSync(policyPath, 'utf8');

                // Replace namespace placeholder
                policyYaml = policyYaml.replace(/{{ NAMESPACE }}/g, namespace);

                // Write to temp file and apply
                const tempFile = path.join('/tmp', `policy-${namespace}-${Date.now()}.yaml`);
                fs.writeFileSync(tempFile, policyYaml, 'utf8');

                const { stderr } = await execAsync(`kubectl apply -f ${tempFile}`);

                // Cleanup temp file
                fs.unlinkSync(tempFile);

                if (stderr && !stderr.includes('created') && !stderr.includes('configured')) {
                    console.warn(`[HelmService] Policy ${policyFile} warnings: ${stderr}`);
                }

                console.log(`[HelmService] Applied ${policyFile} to ${namespace}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to apply isolation policies:`, errorMessage);
            throw new Error(`Failed to apply isolation policies: ${errorMessage}`);
        }
    }
}

export default new HelmService();
