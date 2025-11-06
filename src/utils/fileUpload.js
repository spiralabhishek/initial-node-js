import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const allowedFolders = ["profilepicture", "news", "post"];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.query.folder || req.body.folder;

    if (!folder) {
      throw new Error("Folder name is required (profilepicture, news, post)");
    }

    if (!allowedFolders.includes(folder)) {
      throw new Error(`Invalid folder. Allowed: ${allowedFolders.join(", ")}`);
    }

    return {
      folder: `myapp/${folder}`, // Cloudinary folder structure
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
