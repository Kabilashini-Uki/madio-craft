// middleware/upload.js
import { v2 as cloudinary }      from 'cloudinary';
import { CloudinaryStorage }     from 'multer-storage-cloudinary';
import multer                    from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'madiocraft/products',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
    transformation:   [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'madiocraft/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill' }],
  },
});

const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'madiocraft/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'],
    resource_type:   'auto',
  },
});

const uploadProduct      = multer({ storage: productStorage,  limits: { fileSize: 5  * 1024 * 1024 } });
const uploadAvatarMulter = multer({ storage: avatarStorage,   limits: { fileSize: 2  * 1024 * 1024 } });
const uploadChatMulter   = multer({ storage: chatStorage,     limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadProductImages  = uploadProduct.array('images', 10);
export const uploadSingleImage    = uploadProduct.single('image');
export const uploadAvatar         = uploadAvatarMulter.single('avatar');
export const uploadChatAttachment = uploadChatMulter.single('file');
export { cloudinary };
