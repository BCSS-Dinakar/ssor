import multer from 'multer';
import path from 'path';
import { putBuffer, removeObject } from '../services/storage.service.js';

// Buffer uploads in memory; the persistUploads middleware pushes them to MinIO.
const storage = multer.memoryStorage();

// Configure the upload middleware
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// Generate the object key. Format preserved from the previous disk layout:
// org_<timestamp>_<fieldname>.<ext>
const makeKey = (file) => {
  const ext = path.extname(file.originalname);
  return `org_${Date.now()}_${file.fieldname}${ext}`;
};

const collectFiles = (req) => {
  if (req.files) {
    // upload.fields() -> { field: [file, ...] }; upload.array() -> [file, ...]
    return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  }
  if (req.file) return [req.file];
  return [];
};

/**
 * Runs after multer. Uploads each buffered file to MinIO and sets `file.filename`
 * to the object key, so downstream controllers keep reading `file.filename`
 * exactly as they did with disk storage. If any upload fails (MinIO
 * unavailable), previously uploaded objects in this request are rolled back
 * and the request gets a 503.
 */
export const persistUploads = async (req, res, next) => {
  const files = collectFiles(req);
  const uploaded = [];
  try {
    for (const file of files) {
      const key = makeKey(file);
      const { store } = await putBuffer(key, file.buffer, file.mimetype);
      file.filename = key;   // what controllers persist to the DB
      file.key = key;
      file.store = store;    // 'minio'
      uploaded.push(key);
    }
    next();
  } catch (err) {
    // MinIO unavailable. Roll back anything already stored and fail the request.
    await Promise.all(uploaded.map((k) => removeObject(k)));
    console.error('[persistUploads Error]', err);
    res.status(503).json({
      success: false,
      message: 'File storage is currently unavailable. Please try again later.',
    });
  }
};
