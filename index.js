const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('./connection/db');
const dotenv = require('dotenv');
dotenv.config();

// Validate AUTH_KEY configuration on startup
// CRITICAL: The application uses AUTH_KEY for JWT verification, NOT JWT_SECRET
console.log('\n🔍 Checking AUTH_KEY configuration...');
console.log('   AUTH_KEY is set:', !!process.env.AUTH_KEY);
console.log('   JWT_SECRET is set:', !!process.env.JWT_SECRET);

if (!process.env.AUTH_KEY) {
  // If AUTH_KEY is not set but JWT_SECRET is, use JWT_SECRET as AUTH_KEY
  // This ensures backward compatibility but warns the user
  if (process.env.JWT_SECRET) {
    console.warn('\n⚠️  WARNING: AUTH_KEY is not set, but JWT_SECRET is found.');
    console.warn('   Using JWT_SECRET as AUTH_KEY for backward compatibility.');
    console.warn('   Please update your .env file to use AUTH_KEY instead of JWT_SECRET.');
    process.env.AUTH_KEY = process.env.JWT_SECRET;
    console.log('✅ AUTH_KEY set from JWT_SECRET');
  } else {
    console.error('\n❌ CRITICAL ERROR: AUTH_KEY is not set in environment variables!');
    console.error('   The application requires AUTH_KEY for JWT token verification.');
    console.error('   Please add AUTH_KEY to your .env file.');
    console.error('\n   Current environment variables:');
    console.error('   - AUTH_KEY:', process.env.AUTH_KEY || 'NOT SET');
    console.error('   - JWT_SECRET:', process.env.JWT_SECRET || 'NOT SET');
    process.exit(1);
  }
} else {
  // AUTH_KEY is set - check if JWT_SECRET exists and is different
  if (process.env.JWT_SECRET && process.env.AUTH_KEY !== process.env.JWT_SECRET) {
    console.warn('\n⚠️  WARNING: Both AUTH_KEY and JWT_SECRET are set with different values.');
    console.warn('   The application uses AUTH_KEY (not JWT_SECRET).');
    console.warn('   JWT_SECRET is ignored. Consider removing it from your .env file.');
  }
  console.log('✅ AUTH_KEY is configured correctly');
  console.log('   AUTH_KEY length:', process.env.AUTH_KEY.length, 'characters');
}
console.log('');

// CORS Configuration - Allow all origins
// IMPORTANT: When credentials: true, we must return the actual origin (not '*')
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Additional CORS headers middleware to ensure all responses have proper headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // When credentials is true, we must set the specific origin (not '*')
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // For requests without origin (non-browser), allow all
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const pointsRoutes = require('./routes/pointsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const configurationRoutes = require('./routes/configurationRoutes');

// Route middleware
app.use('/api/points', pointsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/configuration', configurationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: true,
    status_msg: 'Loyalty Points System is running',
    data: {
      timestamp: new Date().toISOString()
    }
  });
});

// Test API Page
app.get('/test-api', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Issue Points API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box; }
        textarea { height: 80px; resize: vertical; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; width: 100%; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .response { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; }
        .response.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .response.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; }
        .info { background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Issue Points API</h1>
        <div class="info">
            <strong>Endpoint:</strong> POST http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/issue<br>
            <strong>Required:</strong> JWT Token, customer_user_id, points_amount<br>
            <strong>Optional:</strong> cash_amount, description
        </div>
        <form id="issueForm">
            <div class="form-group">
                <label for="token">JWT Token (Authorization):</label>
                <input type="text" id="token" name="token" placeholder="Bearer your_jwt_token_here" required>
            </div>
            <div class="form-group">
                <label for="customer_user_id">Customer User ID *:</label>
                <input type="number" id="customer_user_id" name="customer_user_id" placeholder="e.g., 1" required>
            </div>
            <div class="form-group">
                <label for="points_amount">Points Amount *:</label>
                <input type="number" id="points_amount" name="points_amount" step="0.01" placeholder="e.g., 100" required>
            </div>
            <div class="form-group">
                <label for="cash_amount">Cash Amount (optional):</label>
                <input type="number" id="cash_amount" name="cash_amount" step="0.01" placeholder="e.g., 50.00">
            </div>
            <div class="form-group">
                <label for="description">Description (optional):</label>
                <textarea id="description" name="description" placeholder="e.g., Points issued for purchase"></textarea>
            </div>
            <button type="submit" id="submitBtn">Issue Points</button>
        </form>
        <div id="response" class="response"></div>
    </div>
    <script>
        document.getElementById('issueForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            const responseDiv = document.getElementById('response');
            const token = document.getElementById('token').value.trim();
            const customerUserId = document.getElementById('customer_user_id').value;
            const pointsAmount = document.getElementById('points_amount').value;
            const cashAmount = document.getElementById('cash_amount').value;
            const description = document.getElementById('description').value;
            const requestBody = {
                customer_user_id: parseInt(customerUserId),
                points_amount: parseFloat(pointsAmount)
            };
            if (cashAmount) requestBody.cash_amount = parseFloat(cashAmount);
            if (description) requestBody.description = description;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            responseDiv.style.display = 'none';
            try {
                // Always use server URL for API call
                const apiUrl = 'http://ec2-3-96-139-52.ca-central-1.compute.amazonaws.com:3005/api/points/issue';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token.startsWith('Bearer ') ? token : 'Bearer ' + token
                    },
                    body: JSON.stringify(requestBody)
                });
                const data = await response.json();
                responseDiv.style.display = 'block';
                if (response.ok) {
                    responseDiv.className = 'response success';
                    responseDiv.innerHTML = '<strong>✅ Success (' + response.status + ')</strong><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    responseDiv.className = 'response error';
                    responseDiv.innerHTML = '<strong>❌ Error (' + response.status + ')</strong><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }
            } catch (error) {
                responseDiv.style.display = 'block';
                responseDiv.className = 'response error';
                responseDiv.innerHTML = '<strong>❌ Network Error</strong><pre>' + error.message + '</pre>';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Issue Points';
            }
        });
    </script>
</body>
</html>
    `);
});

// QR Code viewer for testing
app.get('/view-qr', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>QR Code Viewer - Loyalty Points System</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  padding: 20px; 
                  background-color: #f5f5f5;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { 
                  color: #333;
                  text-align: center;
                  margin-bottom: 30px;
              }
              textarea { 
                  width: 100%; 
                  height: 100px; 
                  margin: 10px 0; 
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  font-family: monospace;
              }
              button { 
                  padding: 12px 24px; 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  cursor: pointer;
                  border-radius: 5px;
                  font-size: 16px;
              }
              button:hover {
                  background: #0056b3;
              }
              .qr-display { 
                  margin-top: 20px; 
                  text-align: center; 
              }
              .info {
                  background: #e9ecef;
                  padding: 15px;
                  border-radius: 5px;
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>QR Code Viewer - Loyalty Points System</h1>
              
              <div class="info">
                  <strong>Instructions:</strong>
                  <ul>
                      <li>Use this tool to test QR code generation for point redemption</li>
                      <li>Paste the QR code data URL from your API response</li>
                      <li>QR codes are used for point redemption at businesses</li>
                  </ul>
              </div>
              
              <p>Paste the QR code data URL from your API response:</p>
              <textarea id="qrData" placeholder="Paste the qrCodeImage value here (should start with 'data:image/')..."></textarea>
              <br>
              <button onclick="showQR()">Show QR Code</button>
              <div id="qrDisplay" class="qr-display"></div>
          </div>
  
          <script>
              function showQR() {
                  const qrData = document.getElementById('qrData').value.trim();
                  const display = document.getElementById('qrDisplay');
                  
                  if (qrData && qrData.startsWith('data:image/')) {
                      display.innerHTML = '<img src="' + qrData + '" alt="QR Code" style="width: 300px; height: 300px; border: 1px solid #ccc; border-radius: 5px;">';
                  } else {
                      alert('Please paste a valid QR code data URL that starts with "data:image/"');
                  }
              }
          </script>
      </body>
      </html>
    `);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: false,
    status_msg: 'Something went wrong!',
    data: undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    status: false,
    status_msg: 'Route not found',
    data: undefined
  });
});
  
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Loyalty Points System is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`QR Code viewer: http://localhost:${PORT}/view-qr`);
});
