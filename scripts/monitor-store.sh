#!/bin/bash
# Monitor WooCommerce Test Store Provisioning
# Auto-refreshes every 10 seconds

# Get the latest store (most recently created)
STORE_ID=$(curl -s http://localhost:3000/api/stores | jq -r '.stores | sort_by(.created_at) | reverse | .[0].id')

echo "Monitoring Store ID: $STORE_ID"
echo "========================================"
echo ""

while true; do
    clear
    echo "🔍 WooCommerce Test Store Status"
    echo "========================================"
    echo "Store ID: $STORE_ID"
    echo ""
    
    # Get status
    STATUS_JSON=$(curl -s http://localhost:3000/api/stores/$STORE_ID)
    
    STATUS=$(echo $STATUS_JSON | jq -r '.status')
    URL=$(echo $STATUS_JSON | jq -r '.url')
    NAMESPACE=$(echo $STATUS_JSON | jq -r '.namespace')
    NAME=$(echo $STATUS_JSON | jq -r '.name')
    
    echo "Name: $NAME"
    echo "Status: $STATUS"
    echo "URL: $URL"
    echo "Namespace: $NAMESPACE"
    echo ""
    
    if [ "$STATUS" = "ready" ]; then
        echo "✅ STORE IS READY!"
        echo ""
        echo "Next steps:"
        echo "1. Add to /etc/hosts: echo \"127.0.0.1  $(echo $URL | sed 's/http:\/\///')\" | sudo tee -a /etc/hosts"
        echo "2. Open storefront: open $URL"
        echo "3. Follow testing checklist in simple_testing_checklist.md"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ PROVISIONING FAILED"
        echo ""
        echo "Check logs:"
        echo "kubectl get pods -n $NAMESPACE"
        echo "kubectl logs -n $NAMESPACE -l app=mysql"
        break
    else
        echo "⏳ Still provisioning..."
        
        # Show pod status if namespace exists
        if [ -n "$NAMESPACE" ]; then
            echo ""
            echo "Pod Status:"
            kubectl get pods -n $NAMESPACE 2>/dev/null | grep -v "No resources" || echo "  Namespace still being created..."
        fi
    fi
    
    echo ""
    echo "Refreshing in 10 seconds... (Ctrl+C to stop)"
    sleep 10
done
