const dotenv = require('dotenv');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

dotenv.config({ path: './config/config.env' });

const uploadPhoto = (imagePath, model) => async (req, res, next) => {
  if (req.files) {
    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    if (!req.body.name) {
      const data = await model.findById(req.params.id);
      req.body.name = data.name;
    }

    // Check filesize
    if (file.size > process.env.MAX_UPLOAD_SIZE) {
      return next(
        new ErrorResponse(
          `Please upload an image with size less than ${process.env.MAX_UPLOAD_SIZE}`,
          400
        )
      );
    }

    // Create custom filename
    file.name = `photo_${req.body.name}${path.parse(file.name).ext}`;

    file.mv(`${imagePath}/${file.name}`, async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with the server', 500));
      }

      req.body.photo = file.name;
    });
  }
  next();
};

module.exports = uploadPhoto;
