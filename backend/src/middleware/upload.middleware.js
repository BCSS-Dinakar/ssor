import multer from 'multer';
import path from 'path';

// Define storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files are saved to the backend/storage/documents folder
    cb(null, path.join(process.cwd(), 'storage/documents'));
  },
  filename: function (req, file, cb) {
    // Format: org_<timestamp>_<fieldname>.<ext>
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `org_${timestamp}_${file.fieldname}${ext}`);
  }
});

// Configure the upload middleware
export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});
