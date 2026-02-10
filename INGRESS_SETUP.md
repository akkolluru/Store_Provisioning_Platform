# Ingress Setup for Store Access

## Quick Start

To access your stores via Ingress URLs (e.g., `http://mystore.local`):

### Step 1: Start Minikube Tunnel (ONE TIME - Keep Running)

Open a **new terminal** and run:

```bash
./scripts/start-tunnel.sh
```

**IMPORTANT**: 
- This tunnel MUST keep running for Ingress to work
- It will ask for your sudo password
- Don't close this terminal window
- If you restart your computer, you'll need to run this again

### Step 2: Configure DNS (Run After Creating Stores)

```bash
sudo ./scripts/configure-store-dns.sh
```

This adds all your store domains to `/etc/hosts` mapping them to `127.0.0.1`.

### Step 3: Access Your Stores

Open your browser and go to any store URL, for example:
- `http://mystore.local`
- `http://delete-test.local`  
- `http://test2.local`

---

## How It Works

1. **ingress-dns addon**: Enabled in Minikube - provides automatic DNS
2. **minikube tunnel**: Routes traffic from `127.0.0.1` to Ingress controller  
3. **/etc/hosts**: Maps `.local` domains to `127.0.0.1`
4. **nginx Ingress controller**: Routes requests to the correct store based on hostname

---

## Automatic Updates for New Stores

**Currently**: After creating a new store, you must run:
```bash
sudo ./scripts/configure-store-dns.sh
```

This is a one-time script that reads all current Ingress resources and updates `/etc/hosts`.

**Alternative (No Script Needed)**: Use wildcard DNS with dnsmasq:
```bash
# Install dnsmasq (macOS)
brew install dnsmasq

# Configure wildcard for .local domains
echo 'address=/.local/127.0.0.1' > /usr/local/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Configure macOS to use dnsmasq for .local
sudo mkdir -p /etc/resolver
echo 'nameserver 127.0.0.1' | sudo tee /etc/resolver/local
```

With dnsmasq, ALL `.local` domains automatically resolve to `127.0.0.1` without needing to update `/etc/hosts`.

---

## Troubleshooting

### Store URL doesn't load

1. **Check tunnel is running**:
   ```bash
   ps aux | grep "minikube tunnel"
   ```
   Should show a running process

2. **Start tunnel if not running**:
   ```bash
   ./scripts/start-tunnel.sh
   ```

3. **Verify /etc/hosts has the entry**:
   ```bash
   cat /etc/hosts | grep mystore.local
   ```
   Should show: `127.0.0.1  mystore.local`

4. **Check Ingress exists**:
   ```bash
   kubectl get ingress --all-namespaces | grep mystore
   ```

5. **Check Ingress controller**:
   ```bash
   kubectl get svc -n ingress-nginx
   ```
   Should show ingress-nginx-controller service

### New store not accessible

After creating a new store:
```bash
# Re-run DNS configuration
sudo ./scripts/configure-store-dns.sh
```

Or consider setting up dnsmasq for automatic wildcard DNS.

---

## Cleanup

To remove all store DNS entries:
```bash
sudo ./scripts/cleanup-store-dns.sh
```

To remove a specific store:
```bash
sudo ./scripts/cleanup-store-dns.sh mystore
```
