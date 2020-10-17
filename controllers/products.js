const asyncHandler = require('../middlewares/asyncHandler');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const path = require('path');

// @desc    Get products
// @route   GET /api/v1/products
// @route   GET /api/v1/categories/:categoryId/products
// @access  public
exports.getProducts = asyncHandler(async (req, res, next) => {
  if (req.params.categoryId) {
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return next(
        new ErrorResponse(
          `Resource with ${req.params.categoryId} not found`,
          404
        )
      );
    }

    const products = await Product.find({ category: req.params.categoryId });

    return res.status(200).json({
      success: true,
      results: products.length,
      data: products,
    });
  } else {
    res.status(200).json(res.advancedFilter);
  }
});

// @desc    Get product
// @route   GET /api/v1/products/:id
// @access  public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: 'category',
    select: 'name',
  });

  if (!product)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  res.status(200).json({ success: true, data: product });
});

// @desc    Create product
// @route   POST /api/v1/categories/:categoryId/products
// @access  private
exports.createProduct = asyncHandler(async (req, res, next) => {
  req.body.category = req.params.categoryId;
  req.body.user = req.user.id;

  const category = await Category.findById(req.params.categoryId);

  if (!category) {
    return next(
      new ErrorResponse(
        `Category with id ${req.params.categoryId} not found`,
        404
      )
    );
  }

  const product = await Product.create(req.body);

  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id/photo
// @access  private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  // Checking ownership
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this course`,
        401
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
});

// @desc    Upload photo for product
// @route   PUT /api/v1/products/:id/photo
// @access  private
exports.productPhoto = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product)
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
  file.name = `photo_${product._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.PRODUCT_IMAGE_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with the server', 500));
    }

    await Product.findByIdAndUpdate(req.params.id, { photo: file.name });
  });

  res.status(200).json({ success: true, data: file.name });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  private
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product)
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    );

  // Checking ownership
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this course`,
        401
      )
    );
  }

  await product.remove();

  res
    .status(200)
    .json({ success: true, data: `Product ${product.name} is removed` });
});
