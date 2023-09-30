const redis = require('redis');

const redisWrite = redis.createClient({
  host: 'https://sf-rc-prod-001.g1ewrj.ng.0001.apse1.cache.amazonaws.com',
  port: 6379,
});

redisWrite.connect().then(() => {
  console.log('redis is connected');
});

const redisRead = redis.createClient({
  host: 'https://sf-rc-prod-001-ro.g1ewrj.ng.0001.apse1.cache.amazonaws.com',
  port: 6379,
});

redisRead.connect().then(() => {
  console.log('redis is connected');
});

module.exports = { redisWrite, redisRead };
