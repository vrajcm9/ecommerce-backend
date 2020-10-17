const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const asyncHandler = require('../middlewares/asyncHandler');
const color = require('colors');
const path = require('path');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  public
exports.getCategories = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedFilter);
});

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  res.status(200).json({ success: true, data: category });
});

// @desc    Create category
// @route   POST /api/v1/categories
// @access  private
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({ success: true, data: category });
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findOne({
    _id: req.params.id,
  });

  if (!category)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: category });
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  category.remove();

  res.status(200).json({
    success: true,
    data: `Category ${category.name} deleted successfully`,
  });
});

// @desc    Upload photo for category
// @route   PUT /api/v1/categories/:id/photo
// @access  private
exports.categoryPhoto = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
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
  file.name = `photo_${category._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.CATEGORY_IMAGE_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with the server', 500));
    }

    await Category.findByIdAndUpdate(req.params.id, { photo: file.name });
  });

  res.status(200).json({ success: true, data: file.name });
});
