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

        const namespace = storeName;
        const fullDomain = `${subdomain}.${domain}`;

        // Determine chart directory based on engine
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
     * - Local: Uses Ingress hostname → http://<subdomain>.local (requires minikube tunnel)
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

        // Local: Use Ingress-based URL with minikube tunnel
        // The Ingress controller (LoadBalancer type) gets 127.0.0.1 via minikube tunnel
        // /etc/hosts maps <subdomain>.local → 127.0.0.1
        const serviceName = `${storeName}-wordpress`;

        try {
            // Wait for the service to be ready
            console.log(`[HelmService] Waiting for service ${serviceName} in namespace ${namespace} to be ready...`);

            let serviceExists = false;
            let attempts = 0;
            const maxAttempts = 30; // Wait up to 3 minutes (30 * 6 seconds)

            while (!serviceExists && attempts < maxAttempts) {
                try {
                    const checkServiceCmd = `kubectl get service ${serviceName} -n ${namespace} --ignore-not-found -o name`;
                    const { stdout: serviceCheck } = await execAsync(checkServiceCmd);

                    if (serviceCheck.trim()) {
                        serviceExists = true;
                        console.log(`[HelmService] Service ${serviceName} found in namespace ${namespace}`);
                        break;
                    }
                } catch (checkError) {
                    console.warn(`[HelmService] Attempt ${attempts + 1} - Service ${serviceName} not ready yet:`, checkError);
                }

                attempts++;
                await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds between attempts
            }

            if (!serviceExists) {
                throw new Error(`Service ${serviceName} was not created in namespace ${namespace} after ${maxAttempts * 6} seconds`);
            }

            // Wait for the Ingress resource to be ready
            console.log(`[HelmService] Waiting for Ingress resource in namespace ${namespace}...`);
            let ingressReady = false;
            let ingressAttempts = 0;
            const maxIngressAttempts = 10;

            while (!ingressReady && ingressAttempts < maxIngressAttempts) {
                try {
                    const checkIngressCmd = `kubectl get ingress -n ${namespace} --ignore-not-found -o name`;
                    const { stdout: ingressCheck } = await execAsync(checkIngressCmd);

                    if (ingressCheck.trim()) {
                        ingressReady = true;
                        console.log(`[HelmService] Ingress resource found in namespace ${namespace}`);
                        break;
                    }
                } catch (ingressError) {
                    console.warn(`[HelmService] Attempt ${ingressAttempts + 1} - Ingress not ready yet:`, ingressError);
                }

                ingressAttempts++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // Auto-configure /etc/hosts entry for the store domain
            await this.configureLocalDns(fullDomain);

            const url = `http://${fullDomain}`;
            console.log(`[HelmService] Store URL generated: ${url}`);
            return url;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HelmService] Failed to generate store URL: ${errorMessage}`);

            // Provide more detailed error information
            try {
                const listServicesCmd = `kubectl get services -n ${namespace}`;
                const { stdout: servicesList } = await execAsync(listServicesCmd);
                console.error(`[HelmService] Available services in namespace ${namespace}:\n${servicesList}`);
            } catch (listError) {
                console.error(`[HelmService] Could not list services for debugging:`, listError);
            }

            // Even if DNS config fails, still return the Ingress URL
            // User can manually add the /etc/hosts entry
            const fallbackUrl = `http://${fullDomain}`;
            console.warn(`[HelmService] Returning Ingress URL as fallback: ${fallbackUrl}`);
            return fallbackUrl;
        }
    }

    /**
     * Auto-configure /etc/hosts entry for a store's local domain.
     * Maps <subdomain>.local → 127.0.0.1 so that Ingress works via minikube tunnel.
     */
    private async configureLocalDns(domain: string): Promise<void> {
        try {
            // Check if entry already exists in /etc/hosts
            const { stdout: hostsContent } = await execAsync('cat /etc/hosts');

            if (hostsContent.includes(domain)) {
                // Check if it's pointing to 127.0.0.1 already
                const lines = hostsContent.split('\n');
                const existingEntry = lines.find(line => line.includes(domain) && !line.trim().startsWith('#'));

                if (existingEntry && existingEntry.includes('127.0.0.1')) {
                    console.log(`[HelmService] DNS entry for ${domain} already exists and points to 127.0.0.1`);
                    return;
                }

                // Entry exists but points to wrong IP — we need to update it
                console.log(`[HelmService] Updating DNS entry for ${domain} to point to 127.0.0.1`);
            }

            // Add/update the /etc/hosts entry
            // Use a marker-based approach to manage our entries
            const marker = '# store-provisioning-platform';
            const entry = `127.0.0.1  ${domain}  ${marker}`;

            // Remove any existing entry for this domain (our entries only)
            const removeCmd = `sudo sed -i.bak '/${domain}.*${marker}/d' /etc/hosts 2>/dev/null || true`;
            await execAsync(removeCmd);

            // Append the new entry
            const addCmd = `echo '${entry}' | sudo tee -a /etc/hosts > /dev/null`;
            await execAsync(addCmd);

            console.log(`[HelmService] DNS entry added: 127.0.0.1 → ${domain}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(
                `[HelmService] Could not auto-configure /etc/hosts for ${domain}: ${errorMessage}. ` +
                `Please manually add: 127.0.0.1  ${domain}`
            );
            // Don't throw — this is a best-effort operation
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
