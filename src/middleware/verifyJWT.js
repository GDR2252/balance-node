const jwt = require('jsonwebtoken');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();
const { redisRead } = require('../config/redis');

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'not authorized.' });
  const token = authHeader.split(' ')[1];
  logger.debug(token);
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(401).json({ message: 'This token is invalid.' });
      req.user = decoded.username;
      const cacheToken = await redisRead.get(decoded.username);
      if (cacheToken !== token) {
        return res.status(401).json({ message: 'This token is invalid test.' });
      }
      next();
    },
  );
};

module.exports = verifyJWT;
