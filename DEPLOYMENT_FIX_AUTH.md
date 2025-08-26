# 🔧 AUTH_KEY Docker Compose Fix

## ⚠️ IMPORTANT: AUTH_KEY vs JWT_SECRET

**The system uses `AUTH_KEY` for JWT token verification, NOT `JWT_SECRET`!**

- ✅ **AUTH_KEY** - This is what the application actually uses (in `middlewares/authMiddleware.js`)
- ❌ **JWT_SECRET** - This is NOT used anywhere in the code (kept only for compatibility)

Make sure your `.env` file has **AUTH_KEY** set correctly!

## What Was Fixed

The `docker-compose.yml` has been updated to **explicitly pass the AUTH_KEY environment variable** to the Docker container.

### Before:
```yaml
environment:
  - PORT=3005
  - NODE_ENV=production
```

### After:
```yaml
environment:
  - PORT=3005
  - NODE_ENV=production
  - AUTH_KEY=${AUTH_KEY}  # ← Added this line
```

## Why This Was Needed

Even though `env_file: .env` loads all variables, explicitly declaring `AUTH_KEY` in the environment section ensures:
1. The variable is properly passed to the container
2. It's visible in container environment (`docker exec` commands)
3. No confusion between JWT_SECRET and AUTH_KEY
4. Better compatibility across Docker versions

---

## 🚀 How to Deploy the Fix

### Option 1: Using Deploy Script (Recommended)

**Step 1:** Ensure your local `.env` has AUTH_KEY:
```bash
# On Windows PowerShell
cd E:\loyaltyPoints
cat .env | Select-String "AUTH_KEY"
```

If AUTH_KEY is missing, add it:
```env
AUTH_KEY=your_actual_auth_key_value_here
```

**Step 2:** Run the deployment script:
```powershell
.\deploy.ps1
```

This will:
- Upload updated `docker-compose.yml`
- Upload your `.env` file with AUTH_KEY
- Rebuild and restart the container
- Run health check

---

### Option 2: Manual Deployment

**Step 1:** SSH to the server:
```powershell
ssh -i "E:\aws-services-stage.pem" ubuntu@ec2-3-96-139-52.ca-central-1.compute.amazonaws.com
```

**Step 2:** Upload the updated docker-compose.yml:
```powershell
# From your local machine (in a new PowerShell window)
scp -i "E:\aws-services-stage.pem" docker-compose.yml ubuntu@ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:/home/ubuntu/loyalty-points-system/
```

**Step 3:** Update .env file on server (via SSH):
```bash
cd /home/ubuntu/loyalty-points-system

# Edit .env to add AUTH_KEY
nano .env

# Add this line:
AUTH_KEY=your_actual_auth_key_value_here

# Save: Ctrl+X, Y, Enter
```

**Step 4:** Redeploy the container:
```bash
# Stop and remove the container
docker-compose down

# Start with new configuration
docker-compose up -d

# Verify it's running
docker ps

# Check logs
docker-compose logs -f --tail=50
```

**Step 5:** Verify AUTH_KEY is loaded in container:
```bash
# Check if AUTH_KEY is set inside the container
docker exec -it loyalty-points-system env | grep AUTH_KEY

# You should see output like:
# AUTH_KEY=your_actual_auth_key_value_here
```

---

## ✅ Verification Steps

### 1. Check Container Environment
```bash
ssh -i "E:\aws-services-stage.pem" ubuntu@ec2-3-96-139-52.ca-central-1.compute.amazonaws.com

docker exec -it loyalty-points-system env | grep AUTH_KEY
```

**Expected Output:**
```
AUTH_KEY=your_auth_key_value
```

**Problem if you see:**
```
(no output) ← AUTH_KEY is not set
```

### 2. Test Health Endpoint
```bash
curl http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/health
```

**Expected:**
```json
{
  "status": true,
  "status_msg": "Loyalty Points System is running",
  "data": {
    "timestamp": "..."
  }
}
```

### 3. Test Authenticated Endpoint with Your Token
```bash
curl -X GET http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/user/points \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c21hbi43ODZAbm92ZWxtYS5jb20iLCJsb2dvX3VybCI6IiIsInVzZXJfY2F0ZWdvcnkiOjIsInByb2ZpbGUiOnsiaWQiOjIsIm5hbWUiOiJOb3ZlbG1hIiwidXNlcl9pZCI6MSwiYnVzaW5lc3NfY2F0ZWdvcnlfaWQiOjE2LCJidXNpbmVzc19zdWJfY2F0ZWdvcnlfaWQiOjYzfSwiY2l0eV9pZCI6MSwiaXNfbmV3X3VzZXIiOmZhbHNlLCJpYXQiOjE3Njc3MDM5OTAsImV4cCI6MTc2ODI0Mzk5MH0.1V3H6EszNQMhzlsi9GaeA2e1_mMwAM_F-5Jfri9iQMw"
```

**Expected Success:**
```json
{
  "status": true,
  "status_msg": "User points retrieved successfully",
  "data": {
    "userId": 1,
    "pointsIssued": 0,
    ...
  }
}
```

**Before Fix (Error):**
```json
{
  "status": false,
  "status_msg": "Invalid Token",
  "data": undefined
}
```

---

## 🔍 Troubleshooting

### Issue: AUTH_KEY still not showing in container

**Solution:**
```bash
# Make sure .env file has AUTH_KEY
cd /home/ubuntu/loyalty-points-system
grep AUTH_KEY .env

# If not found, add it:
echo "AUTH_KEY=your_value_here" >> .env

# Must use down/up (not restart) to reload environment variables
docker-compose down
docker-compose up -d
```

### Issue: Token still shows "Invalid Token"

**Possible causes:**
1. AUTH_KEY on server doesn't match the key used to sign the token locally
2. .env file wasn't updated
3. Container wasn't properly restarted with new environment

**Solution:**
```bash
# 1. Verify AUTH_KEY in .env
cat .env | grep AUTH_KEY

# 2. Verify AUTH_KEY in container
docker exec -it loyalty-points-system env | grep AUTH_KEY

# 3. If they don't match, update .env and redeploy
nano .env  # Update AUTH_KEY
docker-compose down
docker-compose up -d
```

### Issue: Container won't start after changes

**Check logs:**
```bash
docker-compose logs --tail=100
```

**Common issues:**
- Syntax error in docker-compose.yml
- Missing .env file
- Port 3005 already in use

**Solution:**
```bash
# Fix docker-compose.yml syntax
docker-compose config  # Validates YAML syntax

# Ensure .env exists
ls -la .env

# Check port usage
netstat -tulpn | grep 3005
```

---

## 📋 Summary

✅ **Updated Files:**
- `docker-compose.yml` - Added explicit AUTH_KEY environment variable
- `env.example` - Added AUTH_KEY as required field
- `TROUBLESHOOTING_JWT.md` - Complete troubleshooting guide

✅ **What This Fixes:**
- Ensures AUTH_KEY is properly passed from .env to Docker container
- Eliminates JWT token verification failures
- Makes environment configuration explicit and visible

✅ **Next Steps:**
1. Deploy using `.\deploy.ps1` (easiest)
2. OR manually follow Option 2 steps above
3. Verify with test commands
4. Your JWT token should now work on production! 🎉

---

## Important Notes

⚠️ **Always use `docker-compose down` and `docker-compose up -d` instead of `docker-compose restart`**
- `restart` does NOT reload environment variables
- `down/up` fully recreates the container with new environment

⚠️ **Keep AUTH_KEY consistent across environments**
- Same AUTH_KEY on local and production
- Store securely (password manager, secrets vault)
- Never commit to Git

⚠️ **Token Expiration**
- Your current token expires: January 12, 2026
- After expiration, generate a new token
- Consider implementing token refresh mechanism

