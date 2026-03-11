// middleware/upload.js  — local disk storage (no Cloudinary)
import multer from 'multer';
import path   from 'path';
import fs     from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root uploads directory  →  backend/uploads/
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Ensure sub-folders exist on startup
['products', 'avatars', 'covers', 'chat'].forEach(sub =>
  fs.mkdirSync(path.join(UPLOADS_ROOT, sub), { recursive: true })
);

/** Return a multer diskStorage engine that saves into uploads/<folder>/ */
const diskEngine = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) =>
      cb(null, path.join(UPLOADS_ROOT, folder)),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });

const imgFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

export const uploadProductImages  = multer({ storage: diskEngine('products'), fileFilter: imgFilter, limits: { fileSize: 8  * 1024 * 1024 } }).array('images', 10);
export const uploadSingleImage    = multer({ storage: diskEngine('products'), fileFilter: imgFilter, limits: { fileSize: 8  * 1024 * 1024 } }).single('image');
export const uploadAvatar         = multer({ storage: diskEngine('avatars'),  fileFilter: imgFilter, limits: { fileSize: 5  * 1024 * 1024 } }).single('avatar');
export const uploadCover          = multer({ storage: diskEngine('covers'),   fileFilter: imgFilter, limits: { fileSize: 8  * 1024 * 1024 } }).single('coverImage');
export const uploadChatAttachment = multer({ storage: diskEngine('chat'),     fileFilter: imgFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

/**
 * Convert a saved file into a { url, public_id } object that the rest of
 * the app expects.  `req` is needed to build the absolute URL.
 * public_id stores the relative path so it can be deleted later if needed.
 */
export const fileToImageObj = (req, file, subfolder) => {
  const relativePath = `${subfolder}/${file.filename}`;
  const host = `${req.protocol}://${req.get('host')}`;
  return {
    url:       `${host}/uploads/${relativePath}`,
    public_id: relativePath,
  };
};

/** Delete a locally-stored image by its public_id (relative path) */
export const deleteLocalFile = (publicId) => {
  try {
    const fullPath = path.join(UPLOADS_ROOT, publicId);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (e) {
    console.warn('Could not delete local file:', publicId, e.message);
  }
};
