const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a user
// @route   POST /api/v1/auth/register
// @access  public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, role, password } = req.body;

  const user = await User.create({
    name,
    email,
    role,
    password,
  });

  // Send token with cookie
  sendCookieResponse(user, 200, res);
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please enter credentials', 400));
  }

  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Compare hashed password
  const checkPassword = await user.comparePassword(password);

  if (!checkPassword) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  user = await User.findOne({ email });

  // Send token with cookie
  sendCookieResponse(user, 200, res);
});

// @desc    Get loggedin user
// @route   POST /api/v1/auth/me
// @access  private
exports.getMe = asyncHandler(async (req, res, next) => {
  //const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, data: req.user });
});

// @desc    Logout and clear cookie token
// @route   GET /api/v1/auth/logout
// @access  private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: 'User logged out' });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    email: req.body.email,
    name: req.body.name,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendCookieResponse(user, 200, res);
});

// @desc    Generate reset token
// @route   POST /api/v1/auth/forgotpassword
// @access  public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = await user.generateResetToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the
                  reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset Token',
      text: message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (error) {
    console.log(error);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email did not sent', 500));
  }

  console.log(resetToken);

  res.status(200).json({ success: true, data: user });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resetToken
// @access  public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash the reset token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set the new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendCookieResponse(user, 200, res);
});

// Method to send cookie response
sendCookieResponse = (user, statusCode, res) => {
  const token = user.getSignedJWT();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE_COOKIE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user,
  });
};
