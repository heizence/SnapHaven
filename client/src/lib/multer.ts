import multer from "multer";

// Configure Multer
const storage = multer.memoryStorage(); // Store files in memory before uploading to S3
const upload = multer({ storage });

export default upload;

/*
import multer from "multer";
import path from "path";
import fs from "fs";

// Define upload directory
const uploadDir = path.join(process.cwd(), "public/uploads");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer to store files locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;
*/
