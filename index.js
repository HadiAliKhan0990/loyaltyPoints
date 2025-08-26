const express = require('express');
const app = express();
require('./connection/db');
const dotenv = require('dotenv');
dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const pointsRoutes = require('./routes/pointsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Route middleware
app.use('/api/points', pointsRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
