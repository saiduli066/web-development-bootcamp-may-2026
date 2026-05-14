import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, getSharedMedia } from "../services/mediaService.js";

const upload = asyncHandler(async (req, res) => {
  const attachment = await uploadMedia(req.user.id, req.file);
  res.status(201).json({ attachment });
});

const shared = asyncHandler(async (req, res) => {
  const items = await getSharedMedia(
    req.params.conversationId,
    req.user.id,
    req.query.type
  );
  res.json({ items });
});

export { upload, shared };
