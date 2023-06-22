const crypto = require('crypto');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);
require('dotenv').config();

const {
  ENCRYPTION_KEY, IV_HEX, AUTH_KEY, AUTH_TAG,
} = process.env;

function decrypt() {
  const encryptedtext = Buffer.from(AUTH_KEY, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(IV_HEX, 'hex'));
  decipher.setAuthTag(Buffer.from(AUTH_TAG, 'hex'));
  let decrypted = decipher.update(encryptedtext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const authenticate = (request) => {
  let returnflag = false;
  const key = request.get('authorization');
  if (typeof key === 'undefined') {
    logger.info('Key is Undefined');
  } else if (key === decrypt()) {
    returnflag = true;
  } else {
    logger.info('Key did not match!');
  }
  return returnflag;
};

module.exports = { authenticate };
