#!/bin/bash
# Configure /etc/hosts with all store subdomains for Ingress access
# On macOS with Docker driver, minikube IP is unreachable from the host.
# We use 127.0.0.1 instead, which works when minikube tunnel is running.

set -e

echo "🔍 Configuring store DNS entries in /etc/hosts..."

# The target IP for DNS entries
# With minikube tunnel running, 127.0.0.1 routes traffic to the Ingress controller
DNS_TARGET="127.0.0.1"

echo "📡 DNS target: $DNS_TARGET (requires 'minikube tunnel' to be running)"

# Check if minikube tunnel is running
if pgrep -f "minikube tunnel" > /dev/null; then
    echo "✅ minikube tunnel is running"
else
    echo "⚠️  minikube tunnel is NOT running!"
    echo "   Start it in a separate terminal: minikube tunnel"
    echo "   Without tunnel, store URLs will not be accessible."
fi

# Get all ingress hosts
echo "🔍 Finding all store ingress hosts..."
INGRESS_HOSTS=$(kubectl get ingress --all-namespaces -o jsonpath='{range .items[*]}{.spec.rules[*].host}{"\n"}{end}' 2>/dev/null | sort -u)

if [ -z "$INGRESS_HOSTS" ]; then
    echo "⚠️  No ingress resources found. No stores created yet?"
    exit 0
fi

# Create backup of /etc/hosts
HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/tmp/hosts.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup of $HOSTS_FILE to $BACKUP_FILE"
sudo cp "$HOSTS_FILE" "$BACKUP_FILE"

echo ""
echo "📝 Adding/Updating entries in $HOSTS_FILE:"
echo "-------------------------------------------"

# Marker for our managed entries
MARKER="# store-provisioning-platform"

# Remove all old entries with our marker
sudo sed -i.bak "/$MARKER/d" "$HOSTS_FILE" 2>/dev/null || true

# Also remove old-style marker entries
START_MARKER="# --- Store Provisioning Platform - Auto-generated entries ---"
END_MARKER="# --- End Store Provisioning Platform entries ---"
sudo sed -i.bak "/$START_MARKER/,/$END_MARKER/d" "$HOSTS_FILE" 2>/dev/null || true

# Remove any leftover emoji lines from old script
sudo sed -i.bak '/✅.*->/d' "$HOSTS_FILE" 2>/dev/null || true

# Add new entries
for host in $INGRESS_HOSTS; do
    echo "$DNS_TARGET  $host  $MARKER" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "  ✅ $host → $DNS_TARGET"
done

echo ""
echo "✅ DNS configuration complete!"
echo ""
echo "You can now access your stores at:"
for host in $INGRESS_HOSTS; do
    echo "  🌐 http://$host"
done

echo ""
echo "💡 Prerequisites:"
echo "   1. minikube tunnel must be running: minikube tunnel"
echo "   2. Ingress controller must be LoadBalancer type"
echo ""
echo "💡 To restore original /etc/hosts:"
echo "   sudo cp $BACKUP_FILE $HOSTS_FILE"

