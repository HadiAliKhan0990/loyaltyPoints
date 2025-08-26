# Loyalty Points System - API Documentation with cURL Examples

## Base URL

### Production URL
```
http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005
```

### Local Development URL
```
http://localhost:3005
```

**Note:** All examples below use the production URL. Replace with localhost URL for local development.

## Authentication
All API endpoints (except `/health` and `/view-qr`) require authentication via Bearer token in the Authorization header.

```bash
Authorization: Bearer <your_jwt_token>
```

### Important: AUTH_KEY Configuration

⚠️ **CRITICAL: The system uses `AUTH_KEY` (NOT `JWT_SECRET`) for JWT token verification!**

JWT tokens are verified using the `AUTH_KEY` environment variable. **Ensure the AUTH_KEY is the same on both local and production environments**, otherwise tokens generated locally will fail verification on production.

**Configuration:**
1. Set `AUTH_KEY` in your `.env` file (this is the key that's actually used)
2. ❌ Do NOT use `JWT_SECRET` - it's not used by the application
3. The `docker-compose.yml` explicitly passes AUTH_KEY to the container
4. After updating AUTH_KEY, restart with: `docker-compose down && docker-compose up -d`

**Verify AUTH_KEY is loaded:**
```bash
# SSH to server and check
docker exec -it loyalty-points-system env | grep AUTH_KEY
```

**Troubleshooting:**
- If you get "Invalid Token" error, verify AUTH_KEY matches between environments
- Check that AUTH_KEY (not JWT_SECRET) is set in your .env file
- See `DEPLOYMENT_FIX_AUTH.md` for AUTH_KEY deployment guide

---

## Table of Contents
1. [Health Check](#health-check)
2. [Points Management APIs](#points-management-apis)
3. [Dashboard APIs](#dashboard-apis)
4. [Configuration APIs](#configuration-apis)
5. [Point Schema APIs](#point-schema-apis)
6. [Tier Management APIs](#tier-management-apis)
7. [Import/Export APIs](#importexport-apis)
8. [Milestone APIs](#milestone-apis)
9. [User Loyalty Points APIs](#user-loyalty-points-apis)

---

## Health Check

### Get Health Status
**Endpoint:** `GET /health`  
**Authentication:** Not required

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/health
```

**Response:**
```json
{
  "status": true,
  "status_msg": "Loyalty Points System is running",
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Points Management APIs

### 1. Issue Points (Business to Customer)
**Endpoint:** `POST /api/points/issue`  
**Authentication:** Required

**Required Parameters:**
- `customer_user_id` (integer, min: 1) - Customer's user ID
- `points_amount` (float, min: 0) - Amount of points to issue

**Optional Parameters:**
- `cash_amount` (float, min: 0) - Associated cash amount
- `description` (string) - Description of the transaction

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_user_id": 123,
    "points_amount": 100.50,
    "cash_amount": 50.25,
    "description": "Purchase at store"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_user_id": 123,
    "points_amount": 100.50
  }'
```

---

### 2. Redeem Points
**Endpoint:** `POST /api/points/redeem`  
**Authentication:** Required

**Required Parameters:**
- `points_to_redeem` (float, min: 0) - Amount of points to redeem

**Optional Parameters:**
- `qr_code_data` (string) - QR code data for redemption verification

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_to_redeem": 50.00,
    "qr_code_data": "{\"user_id\":123,\"points_amount\":50,\"timestamp\":1234567890}"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_to_redeem": 50.00
  }'
```

---

### 3. Gift Points
**Endpoint:** `POST /api/points/gift`  
**Authentication:** Required

**Required Parameters:**
- `points_to_gift` (float, min: 0) - Amount of points to gift
- `recipient_user_id` (integer, min: 1) - Recipient's user ID

**Optional Parameters:** None

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/gift \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_to_gift": 25.00,
    "recipient_user_id": 456
  }'
```

---

### 4. Get User Points Summary
**Endpoint:** `GET /api/points/user/points/:userId`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/user/points/:userId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Generate QR Code for Redemption
**Endpoint:** `POST /api/points/generate-qr`  
**Authentication:** Required

**Required Parameters:**
- `points_amount` (float, min: 0) - Amount of points for the QR code

**Optional Parameters:** None

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/generate-qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_amount": 100.00
  }'
```

---

## Dashboard APIs

### 1. Get User Dashboard Analytics
**Endpoint:** `GET /api/dashboard/user`  
**Authentication:** Required

**Required Parameters:** None

**Optional Query Parameters:**
- `period` (string) - Time period filter. Options: `all`, `week`, `month`, `year`. Default: `all`

**cURL:**
```bash
# Get all-time analytics
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get weekly analytics
curl -X GET "http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/user?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get monthly analytics
curl -X GET "http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/user?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get yearly analytics
curl -X GET "http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/user?period=year" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get System-wide Analytics (Admin Only)
**Endpoint:** `GET /api/dashboard/system`  
**Authentication:** Required

**Required Parameters:** None

**Optional Query Parameters:**
- `period` (string) - Time period filter. Options: `all`, `week`, `month`, `year`. Default: `all`

**cURL:**
```bash
# Get all-time system analytics
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/system \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get weekly system analytics
curl -X GET "http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/dashboard/system?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Configuration APIs

### 1. Get User Configuration
**Endpoint:** `GET /api/configuration/user`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Update User Configuration
**Endpoint:** `PUT /api/configuration/user`  
**Authentication:** Required

**Required Parameters:** None (all parameters are optional)

**Optional Parameters:**
- `user_type` (string) - Options: `citizen`, `business`
- `tier_level` (string) - Options: `bronze`, `silver`, `gold`, `platinum`
- `point_multiplier` (float, 0.1-10) - Point multiplier value
- `default_settings` (boolean) - Use default settings
- `loyalty_type` (string) - Options: `points`, `cashback`, `both`
- `calculation_type` (string) - Options: `fixed`, `percentage`
- `default_points_value` (float, min: 0) - Default points value
- `default_cashback_value` (float, min: 0) - Default cashback value
- `min_redeem_points` (integer, min: 0) - Minimum redeemable points
- `max_redeem_points` (integer, min: 0) - Maximum redeemable points
- `allow_import_to_tt` (boolean) - Allow import to TownTicks
- `allow_export_from_tt` (boolean) - Allow export from TownTicks
- `selected_tier` (string) - Options: `bronze`, `silver`, `gold`, `platinum`
- `points_vs_dollars` (string) - Options: `points`, `dollars`, `both`
- `milestone_bonus_points` (float, min: 0) - Milestone bonus points
- `tier_bonus_points` (float, min: 0) - Tier bonus points
- `milestone_thresholds` (object) - Milestone threshold configuration
- `tier_bonus_multipliers` (object) - Tier bonus multiplier configuration
- `is_active` (boolean) - Configuration active status

**cURL:**
```bash
# Full configuration update
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_type": "business",
    "tier_level": "gold",
    "point_multiplier": 1.5,
    "default_settings": false,
    "loyalty_type": "both",
    "calculation_type": "percentage",
    "default_points_value": 1.00,
    "default_cashback_value": 0.05,
    "min_redeem_points": 100,
    "max_redeem_points": 5000,
    "allow_import_to_tt": true,
    "allow_export_from_tt": true,
    "selected_tier": "gold",
    "points_vs_dollars": "both",
    "milestone_bonus_points": 100.00,
    "tier_bonus_points": 50.00,
    "milestone_thresholds": {
      "100": 10,
      "500": 50,
      "1000": 100
    },
    "tier_bonus_multipliers": {
      "bronze": 1.0,
      "silver": 1.2,
      "gold": 1.5,
      "platinum": 2.0
    },
    "is_active": true
  }'
```

**Minimal Request (Partial update):**
```bash
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tier_level": "gold",
    "point_multiplier": 1.5
  }'
```

---

## Point Schema APIs

### 1. Get Point Schemas
**Endpoint:** `GET /api/configuration/point-schema`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Create Point Schema
**Endpoint:** `POST /api/configuration/point-schema`  
**Authentication:** Required

**Required Parameters:**
- `point_type` (string) - Options: `regular`, `bonus`, `special`, `welcome`, `referral`, `milestone`, `tier`

**Optional Parameters:**
- `point_bonus` (float, min: 0) - Bonus points amount
- `tier_multiplier` (float, 0.1-10) - Tier multiplier
- `base_points` (float, min: 0) - Base points value
- `is_active` (boolean) - Schema active status
- `description` (string) - Schema description

**cURL:**
```bash
# Full schema creation
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "point_type": "bonus",
    "point_bonus": 50.00,
    "tier_multiplier": 1.5,
    "base_points": 100.00,
    "is_active": true,
    "description": "Welcome bonus for new users"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "point_type": "regular"
  }'
```

---

### 3. Update Point Schema
**Endpoint:** `PUT /api/configuration/point-schema/:schemaId`  
**Authentication:** Required

**Required Parameters:**
- `:schemaId` (path parameter) - Schema ID to update
- `point_type` (string) - Options: `regular`, `bonus`, `special`, `welcome`, `referral`, `milestone`, `tier`

**Optional Parameters:**
- `point_bonus` (float, min: 0) - Bonus points amount
- `tier_multiplier` (float, 0.1-10) - Tier multiplier
- `base_points` (float, min: 0) - Base points value
- `is_active` (boolean) - Schema active status
- `description` (string) - Schema description

**cURL:**
```bash
# Full schema update
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "point_type": "special",
    "point_bonus": 75.00,
    "tier_multiplier": 2.0,
    "base_points": 150.00,
    "is_active": true,
    "description": "Special promotion bonus"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "point_type": "milestone"
  }'
```

---

### 4. Delete Point Schema
**Endpoint:** `DELETE /api/configuration/point-schema/:schemaId`  
**Authentication:** Required

**Required Parameters:**
- `:schemaId` (path parameter) - Schema ID to delete

**Optional Parameters:** None

**cURL:**
```bash
curl -X DELETE http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/point-schema/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Tier Management APIs

### 1. Get Tier Information
**Endpoint:** `GET /api/configuration/tier-info`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/tier-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Upgrade Tier
**Endpoint:** `POST /api/configuration/upgrade-tier`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/upgrade-tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

---

## Import/Export APIs

### 1. Get Import/Export Settings
**Endpoint:** `GET /api/configuration/import-export-settings`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/import-export-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Update Import/Export Settings
**Endpoint:** `PUT /api/configuration/import-export-settings`  
**Authentication:** Required

**Required Parameters:** None

**Optional Parameters:**
- `allow_import_to_tt` (boolean) - Allow import to TownTicks
- `allow_export_from_tt` (boolean) - Allow export from TownTicks

**cURL:**
```bash
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/import-export-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "allow_import_to_tt": true,
    "allow_export_from_tt": false
  }'
```

---

### 3. Import Points to TownTicks
**Endpoint:** `POST /api/configuration/import-to-tt`  
**Authentication:** Required

**Required Parameters:**
- `points_amount` (float, min: 0) - Amount of points to import

**Optional Parameters:**
- `source_pool` (string) - Source pool identifier
- `description` (string) - Description of import transaction

**cURL:**
```bash
# Full import request
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/import-to-tt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_amount": 500.00,
    "source_pool": "ExternalPartnerApp",
    "description": "Imported from partner loyalty program"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/import-to-tt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_amount": 500.00
  }'
```

---

### 4. Export Points from TownTicks
**Endpoint:** `POST /api/configuration/export-from-tt`  
**Authentication:** Required

**Required Parameters:**
- `points_amount` (float, min: 0) - Amount of points to export

**Optional Parameters:**
- `destination_pool` (string) - Destination pool identifier
- `description` (string) - Description of export transaction

**cURL:**
```bash
# Full export request
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/export-from-tt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_amount": 300.00,
    "destination_pool": "AirlineMiles",
    "description": "Exported to airline miles program"
  }'
```

**Minimal Request (Required only):**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/export-from-tt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_amount": 300.00
  }'
```

---

## Milestone APIs

### 1. Get Milestones
**Endpoint:** `GET /api/configuration/milestones`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/milestones \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Check Milestones
**Endpoint:** `POST /api/configuration/check-milestones`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/check-milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

---

## User Loyalty Points APIs

### 1. Get User Loyalty Points
**Endpoint:** `GET /api/configuration/user-loyalty-points`  
**Authentication:** Required

**Required Parameters:** None  
**Optional Parameters:** None

**cURL:**
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user-loyalty-points \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Update User Loyalty Points
**Endpoint:** `PUT /api/configuration/user-loyalty-points`  
**Authentication:** Required

**Required Parameters:** None (all parameters are optional)

**Optional Parameters:**
- `points_issued` (float) - Total points issued
- `points_redeemed` (float) - Total points redeemed
- `pointsTransferred` (float) - Total points transferred
- `points_gifted` (float) - Total points gifted
- `pointsExpired` (float) - Total points expired
- `points_available` (float) - Available points
- `cashbackIssued` (float) - Total cashback issued
- `cashbackRedeemed` (float) - Total cashback redeemed
- `cashbackAvailable` (float) - Available cashback
- `currentTier` (string) - Current tier level
- `tier_multiplier` (float) - Tier multiplier

**cURL:**
```bash
# Full update
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user-loyalty-points \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_issued": 1000.00,
    "points_redeemed": 200.00,
    "pointsTransferred": 50.00,
    "points_gifted": 100.00,
    "pointsExpired": 0.00,
    "points_available": 650.00,
    "cashbackIssued": 50.00,
    "cashbackRedeemed": 10.00,
    "cashbackAvailable": 40.00,
    "currentTier": "gold",
    "tier_multiplier": 1.5
  }'
```

**Minimal Request (Partial update):**
```bash
curl -X PUT http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/configuration/user-loyalty-points \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "points_available": 750.00,
    "currentTier": "platinum"
  }'
```

---

## Common Response Format

All API responses follow this format:

```json
{
  "status": true/false,
  "status_msg": "Description of the result",
  "data": {} // Response data or undefined on error
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "status": false,
  "status_msg": "Validation errors",
  "data": [
    {
      "msg": "Points amount must be a positive number",
      "param": "points_amount",
      "location": "body"
    }
  ]
}
```

### Not Found (404)
```json
{
  "status": false,
  "status_msg": "Point schema not found",
  "data": undefined
}
```

### Internal Server Error (500)
```json
{
  "status": false,
  "status_msg": "Failed to process request",
  "data": undefined
}
```

---

## Testing Tips

### 1. Set Environment Variables
Save your API base URL and token as environment variables for easier testing:

**For Production:**
```bash
export API_BASE_URL="http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005"
export JWT_TOKEN="your_actual_jwt_token_here"

# Then use in cURL commands
curl -X GET "$API_BASE_URL/api/points/user/points" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**For Local Development:**
```bash
export API_BASE_URL="http://localhost:3005"
export JWT_TOKEN="your_actual_jwt_token_here"

# Then use in cURL commands
curl -X GET "$API_BASE_URL/api/points/user/points" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**For Windows PowerShell:**
```powershell
$env:API_BASE_URL = "http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005"
$env:JWT_TOKEN = "your_actual_jwt_token_here"

# Then use in cURL commands
curl -X GET "$env:API_BASE_URL/api/points/user/points" `
  -H "Authorization: Bearer $env:JWT_TOKEN"
```

### 2. Using cURL with JSON Files
```bash
# Save request body to file
cat > request.json <<EOF
{
  "customer_user_id": 123,
  "points_amount": 100.50
}
EOF

# Use the file in cURL
curl -X POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @request.json
```

### 3. Pretty Print JSON Response
```bash
# Using jq (if installed)
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/user/points \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Using python
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/user/points \
  -H "Authorization: Bearer $JWT_TOKEN" | python -m json.tool
```

---

## Tier Configuration Reference

| Tier | Minimum Points | Multiplier | Next Tier |
|------|---------------|------------|-----------|
| Bronze | 0 | 1.0 | Silver |
| Silver | 1,000 | 1.2 | Gold |
| Gold | 5,000 | 1.5 | Platinum |
| Platinum | 10,000 | 2.0 | None |

---

## Default Milestone Thresholds

| Points Threshold | Bonus Points |
|-----------------|--------------|
| 100 | 10 |
| 500 | 50 |
| 1,000 | 100 |
| 5,000 | 500 |
| 10,000 | 1,000 |

---

## Notes

1. All monetary values (points, cashback, etc.) are handled as floating-point numbers
2. User IDs are integers
3. All timestamps are in ISO 8601 format
4. QR code images are returned as base64-encoded data URLs
5. The system automatically creates default configurations for new users
6. Tier upgrades are checked based on total points issued
7. Milestone bonuses are awarded only once per milestone per user

---

## Deployment Information

### AWS EC2 Deployment
- **Host:** ec2-3-96-139-52.ca-central-1.compute.amazonaws.com
- **Region:** Canada Central (ca-central-1)
- **Port:** 3005
- **Environment:** Production
- **Container:** Docker (loyalty-points-system)

### Quick Access URLs
- **Health Check:** http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/health
- **QR Code Viewer:** http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/view-qr

### Deployment Script
The service can be deployed using the PowerShell deployment script:
```powershell
.\deploy.ps1
```

This script:
1. Uploads application files to EC2 instance
2. Builds Docker container
3. Starts the service with docker-compose
4. Runs health check verification

---

## Support

For issues or questions, please refer to the project README or contact the development team.






