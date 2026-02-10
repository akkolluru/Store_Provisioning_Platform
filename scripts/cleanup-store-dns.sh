#!/bin/bash
# Remove store DNS entries from /etc/hosts

set -e

HOSTS_FILE="/etc/hosts"

echo "🧹 Cleaning up store DNS entries from /etc/hosts..."

# Check if specific subdomain provided
if [ -n "$1" ]; then
    SUBDOMAIN="$1"
    echo "🎯 Removing specific subdomain: $SUBDOMAIN"
    
    # Create backup
    BACKUP_FILE="/tmp/hosts.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating backup: $BACKUP_FILE"
    sudo cp "$HOSTS_FILE" "$BACKUP_FILE"
    
    # Remove lines containing the subdomain
    sudo sed -i.bak "/$SUBDOMAIN\.local/d" "$HOSTS_FILE"
    
    echo "✅ Removed entries for: $SUBDOMAIN.local"
else
    echo "🧹 Removing all Store Provisioning Platform entries..."
    
    # Create backup
    BACKUP_FILE="/tmp/hosts.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating backup: $BACKUP_FILE"
    sudo cp "$HOSTS_FILE" "$BACKUP_FILE"
    
    # Marker comments
    START_MARKER="# --- Store Provisioning Platform - Auto-generated entries ---"
    END_MARKER="# --- End Store Provisioning Platform entries ---"
    
    # Remove entries between markers
    sudo sed -i.bak "/$START_MARKER/,/$END_MARKER/d" "$HOSTS_FILE"
    
    echo "✅ Removed all store entries"
fi

echo ""
echo "💡 To restore previous /etc/hosts:"
echo "   sudo cp $BACKUP_FILE $HOSTS_FILE"
echo ""
echo "Usage:"
echo "  Remove all store entries:    sudo ./scripts/cleanup-store-dns.sh"
echo "  Remove specific subdomain:   sudo ./scripts/cleanup-store-dns.sh mystore"
