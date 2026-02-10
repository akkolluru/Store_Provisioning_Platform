#!/bin/bash
# Configure /etc/hosts with all store subdomains for Ingress access

set -e

echo "🔍 Configuring store DNS entries in /etc/hosts..."

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOSTS_FILE="/etc/hosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    HOSTS_FILE="/etc/hosts"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Get Minikube IP
echo "📡 Getting Minikube IP..."
MINIKUBE_IP=$(minikube ip 2>/dev/null)

if [ -z "$MINIKUBE_IP" ]; then
    echo "❌ Error: Could not get Minikube IP. Is Minikube running?"
    echo "   Run 'minikube start' first."
    exit 1
fi

echo "✅ Minikube IP: $MINIKUBE_IP"

# Get all ingress hosts
echo "🔍 Finding all store ingress hosts..."
INGRESS_HOSTS=$(kubectl get ingress --all-namespaces -o jsonpath='{range .items[*]}{.spec.rules[*].host}{"\n"}{end}' 2>/dev/null | sort -u)

if [ -z "$INGRESS_HOSTS" ]; then
    echo "⚠️  No ingress resources found. No stores created yet?"
    exit 0
fi

# Create backup of /etc/hosts
BACKUP_FILE="/tmp/hosts.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup of $HOSTS_FILE to $BACKUP_FILE"
sudo cp "$HOSTS_FILE" "$BACKUP_FILE"

echo ""
echo "📝 Adding/Updating entries in $HOSTS_FILE:"
echo "-------------------------------------------"

# Marker comments for our entries
START_MARKER="# --- Store Provisioning Platform - Auto-generated entries ---"
END_MARKER="# --- End Store Provisioning Platform entries ---"

# Remove old entries between markers if they exist
sudo sed -i.bak "/$START_MARKER/,/$END_MARKER/d" "$HOSTS_FILE"

# Add new entries
{
    echo ""
    echo "$START_MARKER"
    for host in $INGRESS_HOSTS; do
        echo "$MINIKUBE_IP  $host"
        echo "  ✅ $host -> $MINIKUBE_IP"
    done
    echo "$END_MARKER"
} | sudo tee -a "$HOSTS_FILE" > /dev/null

echo ""
echo "✅ DNS configuration complete!"
echo ""
echo "You can now access your stores:"
for host in $INGRESS_HOSTS; do
    echo "  🌐 http://$host"
done

echo ""
echo "💡 To restore original /etc/hosts:"
echo "   sudo cp $BACKUP_FILE $HOSTS_FILE"
echo ""
echo "💡 To remove store entries manually:"
echo "   sudo ./scripts/cleanup-store-dns.sh"
