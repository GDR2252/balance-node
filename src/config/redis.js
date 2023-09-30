const redis = require('redis');

const redisWrite = redis.createClient({
  host: process.env.REDIS_WRITE_URL,
  port: 6379,
});

redisWrite.connect().then(() => {
  console.log('redis is connected');
});
// Handle errors
redisWrite.on('error', (err) => {
  console.log(`Error: ${err}`);
});

const redisRead = redis.createClient({
  host: process.env.REDIS_READ_URL,
  port: 6379,
});

redisRead.connect().then(() => {
  console.log('redis is connected');
});

// Handle errors
redisRead.on('error', (err) => {
  console.log(`Error: ${err}`);
});

module.exports = { redisWrite, redisRead };
