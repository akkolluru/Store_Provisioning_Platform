#!/bin/bash
# Start minikube tunnel for Ingress to work
# This must run in the background to enable LoadBalancer services

set -e

echo "🚇 Starting Minikube tunnel for Ingress..."
echo "This will require sudo password and must stay running."
echo ""
echo "⚠️  DO NOT CLOSE THIS TERMINAL - Keep it running in the background"
echo ""

# Start tunnel (this will block and require password)
minikube tunnel
