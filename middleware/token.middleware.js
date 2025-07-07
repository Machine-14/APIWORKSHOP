const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split('Bearer ')[1]; 
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.auth = decodedToken; 
    return next();
  }
  catch (error) {
    return res.status(401).json({
      error: new Error('Invalid request!')
    });
  }
}