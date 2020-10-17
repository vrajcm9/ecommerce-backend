const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token inside headers
  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  console.log(token);

  if (!token) {
    return next(new ErrorResponse('Not authorized to access', 401));
  }

  // Verify the token
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedToken.id);

    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access', 401));
    }
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access', 401));
  }

  next();
});

// Grant access based on roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is unathorized to access this page`,
          403
        )
      );
    }
    next();
  };
};
