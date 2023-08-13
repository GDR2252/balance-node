const aws = require('aws-sdk');
const path = require('path');
const logger = require('log4js').getLogger(path.parse(__filename).name);

exports.uploadImageTos3 = ((img) => new Promise((resolve, reject) => {
  const image = img[0];
  const s3bucket = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  });
  const file = image.buffer;
  const originalFileName = image.originalname;
  const splitedFileName = originalFileName.split('.');
  const fileName = `${new Date().getTime().toString()}.${splitedFileName[splitedFileName.length - 1]}`;
  const folderName = process.env.AWS_FOLDER_NAME;
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folderName}/${fileName}`,
    Body: file,
    Expires: 60,
    ContentType: image.mimetype,
  };

  s3bucket.upload(s3Params, (err, data) => {
    if (err) {
      logger.error(err);
      reject(err);
    } else {
      resolve({
        data,
      });
    }
  });
}));
