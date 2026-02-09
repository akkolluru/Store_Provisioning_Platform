# End-to-End Manual Testing Guide

## Overview
This guide walks you through testing the entire Store Provisioning Platform as both a platform administrator and a customer.

---

## Prerequisites

### 1. Start All Services Locally

```bash
# Start Minikube
minikube start

# Start platform services
./scripts/start-minimal.sh

# Wait for all services to be ready (~2-3 minutes)
kubectl get pods -n store-platform
```

### 2. Get Access URLs

```bash
# Frontend URL
echo "Frontend: http://$(minikube ip):30080"

# Backend API URL
echo "Backend API: http://$(minikube ip):31000"

# Alternative: Use port forwarding (if NodePort doesn't work)
kubectl port-forward -n store-platform svc/frontend 3000:80 &
kubectl port-forward -n store-platform svc/store-service 8080:8080 &
# Then use: http://localhost:3000 and http://localhost:8080
```

---

## Test Flow

### Phase 1: Platform Administrator Tasks

#### Test 1: Access Platform Dashboard

**Steps:**
1. Open browser to frontend URL (from above)
2. You should see the Store Provisioning Platform dashboard

**Expected Result:**
- Dashboard loads with metrics cards
- Shows: Total Stores, Active, Provisioning, Decommissioned
- Empty state if no stores created yet

**Screenshot location:** Take screenshot as `test-screenshots/01-dashboard-empty.png`

---

#### Test 2: Create First Store

**Steps:**
1. Click "Create Store" button (top right)
2. Fill in form:
   - **Store Name**: `techgadgets`
   - **Subdomain**: `techgadgets` 
   - **Engine**: `woocommerce` (default)
3. Click "Create Store"

**Expected Result:**
- Success notification appears
- Store card appears with status "Provisioning"
- After 5-10 minutes, status changes to "Active"

**Monitor progress:**
```bash
# Watch provisioning
kubectl get pods -n techgadgets -w

# Check Helm release
helm list --all-namespaces | grep techgadgets

# View logs if issues
kubectl logs -n techgadgets -l app.kubernetes.io/name=wordpress --tail=50
```

**Screenshot location:** `test-screenshots/02-store-created.png`

---

#### Test 3: Create Second Store (Test Isolation)

**Steps:**
1. Create another store with different name:
   - **Store Name**: `fashionstore`
   - **Subdomain**: `fashionstore`
2. Wait for provisioning

**Expected Result:**
- Both stores run in separate namespaces
- Both show in dashboard
- No resource conflicts

**Verify isolation:**
```bash
# Check namespaces
kubectl get namespaces | grep -E '(techgadgets|fashionstore)'

# Check resources are separate
kubectl get all -n techgadgets
kubectl get all -n fashionstore

# Verify NetworkPolicies applied
kubectl get networkpolicies -n techgadgets
```

---

#### Test 4: Access Store Details

**Steps:**
1. Click on "techgadgets" store card
2. View store details page

**Expected Result:**
- Shows store URL
- Shows status: Active
- Shows creation date
- Shows engine: WooCommerce
- Shows namespace: techgadgets

---

### Phase 2: WooCommerce Initial Setup (As Store Owner)

#### Test 5: Access WooCommerce Store

**Steps:**
1. Get store URL:
```bash
# Get the Ingress/Service URL
minikube service -n techgadgets wordpress --url

# Or check service
kubectl get svc -n techgadgets wordpress
```

2. Open browser to store URL (e.g., `http://192.168.49.2:30XXX`)

**Expected Result:**
- WordPress installation wizard appears (first time only)
- Or WordPress homepage if already installed

**Screenshot location:** `test-screenshots/03-woocommerce-homepage.png`

---

#### Test 6: Complete WordPress Setup

**Steps:**
1. Complete WordPress installation wizard:
   - **Site Title**: Tech Gadgets Store
   - **Username**: `admin`
   - **Password**: (create strong password, save it!)
   - **Email**: your-email@example.com
2. Click "Install WordPress"
3. Login with created credentials

**Expected Result:**
- WordPress admin dashboard loads
- WooCommerce plugin already installed

---

#### Test 7: Configure WooCommerce

**Steps:**
1. In WordPress admin, go to **WooCommerce → Home**
2. Complete WooCommerce setup wizard:
   - **Store Details**: Fill in store address
   - **Industry**: Electronics (or your choice)
   - **Product Types**: Physical products
   - **Business Details**: Skip for testing
   - **Theme**: Skip (use default)
3. Click "Continue" through wizard

**Expected Result:**
- WooCommerce configured
- Shop page created
- Cart and Checkout pages created

---

#### Test 8: Add Products

**Steps:**
1. Go to **Products → Add New**
2. Create product #1:
   - **Name**: Wireless Mouse
   - **Price**: $29.99
   - **Description**: Ergonomic wireless mouse with long battery life
   - **Image**: Upload or skip
   - **Stock status**: In stock
3. Click "Publish"
4. Repeat for product #2:
   - **Name**: Mechanical Keyboard
   - **Price**: $89.99

**Expected Result:**
- Products appear in **Products → All Products**
- Products visible on shop page

**Screenshot location:** `test-screenshots/04-products-added.png`

---

### Phase 3: Customer Experience

#### Test 9: Browse Store as Customer

**Steps:**
1. Open **new incognito/private browser window**
2. Navigate to store URL (same as Test 5)
3. Browse products

**Expected Result:**
- Homepage shows products
- Shop page shows all products
- Product pages load correctly

**Screenshot location:** `test-screenshots/05-customer-view.png`

---

#### Test 10: Add Products to Cart

**Steps:**
1. Click on "Wireless Mouse" product
2. Click "Add to Cart"
3. Continue shopping
4. Add "Mechanical Keyboard" to cart
5. Click cart icon (or "View Cart")

**Expected Result:**
- Cart shows 2 items
- Prices correct
- Total calculated: $119.98

**Screenshot location:** `test-screenshots/06-cart.png`

---

#### Test 11: Complete Checkout

**Steps:**
1. Click "Proceed to Checkout"
2. Fill in billing details:
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: customer@example.com
   - **Phone**: 555-1234
   - **Address**: 123 Main St
   - **City**: San Francisco
   - **State**: CA
   - **ZIP**: 94101
3. Select payment: "Cash on Delivery" (default, no payment gateway needed)
4. Click "Place Order"

**Expected Result:**
- Order confirmation page appears
- Order number displayed
- Email sent to customer@example.com (if mail configured)

**Screenshot location:** `test-screenshots/07-order-confirmation.png`

---

#### Test 12: Verify Order in Admin

**Steps:**
1. Switch back to admin window
2. Go to **WooCommerce → Orders**
3. Find the order just placed

**Expected Result:**
- Order appears with status "Processing"
- Shows customer details
- Shows ordered products
- Total: $119.98

**Screenshot location:** `test-screenshots/08-admin-orders.png`

---

### Phase 4: Platform Verification

#### Test 13: Check Resource Quotas

**Steps:**
```bash
# Check ResourceQuota is enforced
kubectl describe resourcequota -n techgadgets

# Check LimitRange is applied
kubectl describe limitrange -n techgadgets

# Verify pod has default limits
kubectl describe pod -n techgadgets -l app.kubernetes.io/name=wordpress | grep -A 5 "Limits:"
```

**Expected Result:**
```
ResourceQuota shows:
  requests.cpu: 0/2
  requests.memory: 0/4Gi
  pods: 3/10 (approx)
  
LimitRange shows:
  Container default limits: 500m CPU, 512Mi memory
```

---

#### Test 14: Test Network Isolation

**Steps:**
```bash
# Try to access MySQL from outside namespace (should fail)
kubectl run test-curl --image=curlimages/curl -n store-platform --rm -it -- \
  curl --max-time 5 http://mysql.techgadgets.svc.cluster.local:3306

# Access from within namespace (should work)
kubectl exec -n techgadgets deployment/wordpress -- nc -zv mysql 3306
```

**Expected Result:**
- External access: Connection timeout ❌
- Internal access: Connection successful ✅

---

#### Test 15: Check Audit Logs

**Steps:**
```bash
# Get backend pod
BACKEND_POD=$(kubectl get pod -n store-platform -l app=store-service -o name | head -1)

# View audit logs
kubectl logs -n store-platform $BACKEND_POD | grep "AUDIT"

# Or check database
kubectl exec -n store-platform deployment/postgres -- \
  psql -U storeuser -d storedb -c "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;"
```

**Expected Result:**
- Logs show CREATE_STORE events
- Logs show user actions with timestamps
- All critical operations logged

---

#### Test 16: Delete Store (Cleanup Test)

**Steps:**
1. In platform dashboard, click on "fashionstore"
2. Click "Delete Store" button
3. Confirm deletion

**Expected Result:**
- Store removed from dashboard
- Namespace deleted: `kubectl get ns fashionstore` → Not found
- All resources cleaned up

**Verify cleanup:**
```bash
# Namespace should be gone
kubectl get namespace fashionstore
# Expected: Error: namespaces "fashionstore" not found

# Helm release should be gone
helm list --all-namespaces | grep fashionstore
# Expected: No output
```

---

## Bug Testing & Edge Cases

### Test 17: Invalid Store Creation

**Steps:**
1. Try creating store with invalid name (e.g., "My Store!" with spaces/special chars)
2. Try creating duplicate store name

**Expected Result:**
- Validation error displayed
- Store not created
- Helpful error message shown

---

### Test 18: Concurrent Store Creation

**Steps:**
1. Open two browser windows
2. Create two stores simultaneously
3. Monitor both

**Expected Result:**
- Both stores created successfully
- No race conditions
- Both provision independently

---

## Success Criteria Checklist

- [ ] Dashboard loads and displays metrics correctly
- [ ] Can create multiple stores successfully
- [ ] Each store provisions in separate namespace
- [ ] WooCommerce installation wizard works
- [ ] Can configure products in WooCommerce
- [ ] Customers can browse products
- [ ] Can add products to cart
- [ ] Can complete checkout process
- [ ] Orders appear in admin panel
- [ ] ResourceQuota and LimitRange enforced
- [ ] NetworkPolicies block unauthorized access
- [ ] Audit logs capture all actions
- [ ] Can delete stores cleanly
- [ ] Invalid inputs are rejected
- [ ] Concurrent provisioning works

---

## Troubleshooting

### Issue: Store stuck in "Provisioning"

```bash
# Check Helm status
helm status techgadgets

# Check pod status
kubectl get pods -n techgadgets

# Check pod logs
kubectl logs -n techgadgets -l app.kubernetes.io/name=wordpress
kubectl logs -n techgadgets -l app.kubernetes.io/name=mysql

# Check events
kubectl get events -n techgadgets --sort-by='.lastTimestamp'
```

### Issue: Can't access store URL

```bash
# Check service
kubectl get svc -n techgadgets

# Check ingress (if using)
kubectl get ingress -n techgadgets

# Use port forwarding instead
kubectl port-forward -n techgadgets svc/wordpress 8888:80
# Then access: http://localhost:8888
```

### Issue: Order placement fails

- Check payment method is configured (use Cash on Delivery for testing)
- Check WooCommerce settings: **WooCommerce → Settings → General**
- Ensure shipping zones configured: **WooCommerce → Settings → Shipping**

---

## Test Report Template

After testing, fill out this report:

```markdown
# Test Report - Store Provisioning Platform

**Date**: 2026-02-09
**Tester**: [Your Name]
**Environment**: Minikube local

## Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Access Dashboard | ✅ PASS | |
| 2 | Create First Store | ✅ PASS | Took 8 minutes |
| 3 | Create Second Store | ✅ PASS | |
| ... | ... | ... | ... |

## Issues Found

1. [Issue description]
2. [Issue description]

## Screenshots

- All screenshots saved to `test-screenshots/` directory
- Total screenshots: X

## Overall Result: ✅ PASS / ❌ FAIL

**Summary**: [Brief summary of testing]
```

---

## Next Steps After Testing

1. ✅ Fix any bugs found
2. ✅ Take all required screenshots
3. ✅ Document any workarounds needed
4. 🚀 Ready for production deployment!
