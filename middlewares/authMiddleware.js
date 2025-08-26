const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      status: false,
      status_msg: "A token is required for authentication",
      data: undefined
    });
  }

  token = token.split(" ")[1];
  
  try {
    // Check if AUTH_KEY is set
    if (!process.env.AUTH_KEY && !process.env.JWT_SECRET) {
      console.error('ERROR: Neither AUTH_KEY nor JWT_SECRET is set in environment variables!');
      return res.status(500).send({
        status: false,
        status_msg: "Server configuration error: AUTH_KEY or JWT_SECRET not set",
        data: undefined
      });
    }

    // Try AUTH_KEY first, then JWT_SECRET as fallback
    let decoded;
    let usedKey = 'AUTH_KEY';
    
    try {
      if (process.env.AUTH_KEY) {
        decoded = jwt.verify(token, process.env.AUTH_KEY);
      } else {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        usedKey = 'JWT_SECRET';
      }
    } catch (verifyError) {
      // If AUTH_KEY fails and JWT_SECRET exists and is different, try JWT_SECRET
      if (verifyError.name === 'JsonWebTokenError' && 
          process.env.JWT_SECRET && 
          process.env.AUTH_KEY !== process.env.JWT_SECRET) {
        console.log('JWT verification with AUTH_KEY failed, trying JWT_SECRET...');
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        usedKey = 'JWT_SECRET';
      } else {
        throw verifyError;
      }
    }
    
    // Add decoded user info to request object
    req.user = decoded;
    return next();
  } catch (err) {
    // Log the error for debugging (without exposing sensitive data)
    console.error('JWT Verification Error:', {
      name: err.name,
      message: err.message,
      authKeySet: !!process.env.AUTH_KEY,
      authKeyLength: process.env.AUTH_KEY ? process.env.AUTH_KEY.length : 0,
      jwtSecretSet: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    });

    return res.status(401).send({
      status: false,
      status_msg: "Invalid Token",
      data: {
        name: err.name,
        message: err.message,
        hint: err.name === 'JsonWebTokenError' && err.message === 'invalid signature' 
          ? 'AUTH_KEY mismatch - the key used to sign the token does not match the key used to verify it'
          : undefined
      }
    });
  }
};

module.exports = { 
  verifyToken
}; 