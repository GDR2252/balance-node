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
    const reqString = JSON.stringify(req.body.data, null)
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
    
    

    if(is_valid){
        let data = JSON.stringify(req.body.data);
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: req.body.url,
            headers: { 
              'Content-Type': 'application/json', 
              'x-st8-sign': sign_b64
            },
            data : data
          };
          
          axios.request(config)
          .then((response) => {
            console.log(JSON.stringify(response.data));
            return res.send({is_valid, st8Response: response.data })
          })
          .catch((error) => {
            console.log(error.response.data);
            return res.send({is_valid, st8Error: error.response.data })
          });
    }else{
        return res.send({message: "Something went wrong!" })
    }
}

module.exports = {
    signBody
  };

// 1. Game Lanuch API 

// {
//     "data" : {
//        "game_code": "gmz_go_wild",
//         "currency": "INR",
//         "site": {
//         "id": "cbtf",
//         "lobby": "https://cbt001.o.p8d.xyz/games",
//         "deposit": "https://cbt001.o.p8d.xyz/cashier"
//         },
//             "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5pa3VuaiIsImlhdCI6MTY5Mjg3NTAzMCwiZXhwIjoxNjkyOTYxNDMwfQ.ylP_RgJZ_Xxf_avzDOlTUXreTGZArN4sWyJwAHEH9To",
//             "player": "user_1234",
//             "country": "IN",
//             "lang": "eng",
//             "device": "DESKTOP",
//             "fun_mode": false,
//             "player_profile": {
//             "id": "user_1234",
//             "jurisdiction": "CeG",
//             "default_currency": "INR",
//             "reg_country": "IN",
//             "affiliate": "aff_5678",
//             "bet_limits": "low",
//             "birth_date": "1999-04-01",
//             "reg_date": "2022-04-10",
//             "attributes": {
//             "labels": [
//             "table game preference",
//             "language English"
//             ]
//             }
//         }
//     },
//     "url" : "https://cbt001.o.p8d.xyz/api/operator/v1/launch"
// }


// 2. Get balance API 
// {
//     "data" : {
//         "player": "user_1234",
//         "currency": "INR",
//         "site": "cbtf",
//         "developer_code": "btsl"
//     },
//     "url" : "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/balance"
// }

// 3. Deposit API 
// {
//     "data" : {
//         "transaction_id": "adr4702abc4b4t7ae6b571979abhd817c987",
//         "player": "user_1234",
//         "amount": 11.6,
//         "currency":"INR",
//         "site": "cbtf"
//     },
//     "url" : "https://cbt001.o.p8d.xyz/api/operator/v1/cashier/deposit"
// }