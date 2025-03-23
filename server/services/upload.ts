import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Express, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const prescriptionsDir = path.join(uploadsDir, 'prescriptions');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(prescriptionsDir)) {
  fs.mkdirSync(prescriptionsDir, { recursive: true });
}

// Configure storage for prescription images
const prescriptionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, prescriptionsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to only allow image files
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image files only
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG and GIF files are allowed.'));
  }
};

// Create upload middleware for prescription images
export const prescriptionUpload = multer({
  storage: prescriptionStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Get the public path for a file
export function getPublicFilePath(filename: string, type: 'prescription'): string {
  let filePath;
  
  switch (type) {
    case 'prescription':
      filePath = path.join('/uploads/prescriptions', filename);
      break;
    default:
      throw new Error(`Invalid file type: ${type}`);
  }
  
  return filePath;
}

// Get the absolute path for a file
export function getAbsoluteFilePath(filename: string, type: 'prescription'): string {
  let filePath;
  
  switch (type) {
    case 'prescription':
      filePath = path.join(prescriptionsDir, filename);
      break;
    default:
      throw new Error(`Invalid file type: ${type}`);
  }
  
  return filePath;
}