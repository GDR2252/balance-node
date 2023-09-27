const jwt = require('jsonwebtoken');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'not authorized.' });
  const token = authHeader.split(' ')[1];
  logger.debug(token);
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) return res.status(401).json({ message: 'This token is invalid.' });
      req.user = decoded.username;
      next();
    },
  );
};

module.exports = verifyJWT;
