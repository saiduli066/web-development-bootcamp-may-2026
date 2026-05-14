import { ApiError } from "../utils/apiError.js";

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    return next();
  } catch (error) {
    const message =
      error?.errors?.map((item) => item.message).join(", ") ||
      "Invalid request data";
    return next(new ApiError(400, message));
  }
};

export { validate };
