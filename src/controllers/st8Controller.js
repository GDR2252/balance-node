const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);

// Sign body 
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');
const { default: axios } = require('axios');

var priv_pem = rsu.readFile('./ec.key');
var priv_key = rs.KEYUTIL.getKey(priv_pem);
var pub_pem = rsu.readFile('./ec.pub');
var pub_key = rs.KEYUTIL.getKey(pub_pem);

async function signBody(req, res) {
    const data = req.body
    const reqString = JSON.stringify(req.body, null, 1)
    var sign = new rs.KJUR.crypto.Signature({alg: 'SHA256withECDSA'});
    sign.init(priv_key);
    var sign_hex = sign.signString(reqString);
    var sign_b64 = rs.hextob64(sign_hex);
    console.log('Signature is:');
    console.log(sign_b64);

    var signature_to_verify = rs.b64nltohex(sign_b64);
    var sign_pub = new rs.KJUR.crypto.Signature({alg: 'SHA256withECDSA'});
    sign_pub.init(pub_key);
    sign_pub.updateString(reqString);
    var is_valid = sign_pub.verify(signature_to_verify);

    console.log('Signature valid?:');
    console.log(is_valid);
    console.log(reqString);
    

    if(is_valid){
        axios.post("https://cbt001.o.p8d.xyz/api/operator/v1/cashier/deposit",
        reqString,
        // "{\"transaction_id\":\"adr6702abc4b4t7ae6b971979abhd817c987\",\"player\":\"user_1234\",\"amount\":91.4,\"currency\":\"INR\",\"site\":\"cbtf\"}", 
        {
            "Content-Type" : "application/json;charset=utf-8",
            "x-st8-sign" : sign_b64
        }).then(res => console.log(res.data)).catch(err => console.log(err))
    }
    return res.send({is_valid, sign_b64, reqString })
}

module.exports = {
    signBody
  };