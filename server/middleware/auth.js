import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/tokens.js";

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = header.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export { auth };
