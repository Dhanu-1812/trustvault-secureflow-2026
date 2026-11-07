const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateUuidParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value || !UUID_REGEX.test(value)) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    next();
  };
};

module.exports = validateUuidParam;