import express from "express";
import { uploadFiles } from "../controllers/upload.controller.js";
import { upload } from "../utils/fileUpload.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔒 Protect this route (optional)
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/upload
 * @desc    Upload one or more images to Cloudinary
 * @query   folder=profilepicture|news|post
 * @access  Private
 */
router.post("/", upload.array("files", 10), uploadFiles);

export default router;
