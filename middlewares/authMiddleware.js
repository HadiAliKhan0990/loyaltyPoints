const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.AUTH_KEY);
    
    // Add decoded user info to request object
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).send({
      status: false,
      status_msg: "Invalid Token",
      data: undefined
    });
  }
};

module.exports = { 
  verifyToken
}; 