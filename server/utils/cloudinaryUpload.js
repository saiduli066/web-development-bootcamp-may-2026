import { cloudinary } from "../config/cloudinary.js";

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );
    stream.end(buffer);
  });

export { uploadBuffer };
