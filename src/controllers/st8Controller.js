const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);

// Sign body 
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');

var priv_pem = rsu.readFile('../config/ec.key');
var priv_key = rs.KEYUTIL.getKey(priv_pem);
var pub_pem = rsu.readFile('../config/ec.pub');
var pub_key = rs.KEYUTIL.getKey(pub_pem);

async function signBody(req, res) {
    

    var sign = new rs.KJUR.crypto.Signature({alg: 'SHA256withECDSA'});
    sign.init(priv_key);
    var sign_hex = sign.signString('test');
    var sign_b64 = rs.hextob64(sign_hex);
    console.log('Signature is:');
    console.log(sign_b64);


    var signature_to_verify = rs.b64nltohex(sign_b64);
    var sign_pub = new rs.KJUR.crypto.Signature({alg: 'SHA256withECDSA'});
    sign_pub.init(pub_key);
    sign_pub.updateString('test');
    var is_valid = sign_pub.verify(signature_to_verify);

    console.log('Signature valid?:');
    console.log(is_valid);
}

module.exports = {
    signBody
  };