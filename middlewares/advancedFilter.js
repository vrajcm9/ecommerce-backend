const advancedFilter = (model, path, fields) => async (req, res, next) => {
  let query;

  // Make a copy of req.query
  const requestQuery = { ...req.query };

  // Array of filtering queries to delete
  const removeFields = ['select', 'sort', 'page', 'limit'];

  removeFields.forEach((params) => delete requestQuery[params]);

  // Replacing operators with $operators
  let queryStr = JSON.stringify(requestQuery);

  queryStr = queryStr.replace(
    /\b(lt|lte|gt|gte|in)\b/g,
    (match) => `$${match}`
  );

  // Making the query
  query = model.find(JSON.parse(queryStr));

  // Filter by select
  if (req.query.select) {
    const fields = req.query.select.replace(',', ' ');
    query = query.select(fields);
  }

  // Sorting
  if (req.query.sort) {
    const fields = req.query.sort.replace(',', ' ');
    query = query.sort(fields);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (path) {
    query = query.populate({
      path: path,
      select: fields,
    });
  }

  // Executing the query
  const filterResults = await query;

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.previous = {
      page: page - 1,
      limit,
    };
  }

  res.advancedFilter = {
    success: true,
    results: filterResults.length,
    pagination,
    data: filterResults,
  };

  next();
};

module.exports = advancedFilter;
