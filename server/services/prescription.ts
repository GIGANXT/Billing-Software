import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import * as JimpModule from 'jimp';

// Workaround for dynamic import
let Jimp: any;
(async () => {
  // Use dynamic import to work around ES modules
  Jimp = (await import('jimp')).default;
})();

/**
 * Processes a prescription image to improve readability
 * - Converts to grayscale
 * - Increases contrast
 * - Applies thresholding
 */
export async function preprocessImage(imagePath: string): Promise<string> {
  try {
    // Using CommonJS require
    const image = await Jimp.read(imagePath);
    const processedPath = imagePath.replace(/\.\w+$/, '_processed$&');
    
    // Process the image
    image
      .greyscale() // Convert to grayscale
      .contrast(0.3) // Increase contrast
      .brightness(0.05) // Slightly brighten
      .quality(100) // High quality
      .write(processedPath); // Save processed image
    
    return processedPath;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return imagePath; // Return original path on error
  }
}

/**
 * Extracts text from a prescription image using OCR
 * Returns extracted medicine names and dosage information
 */
export async function extractTextFromPrescription(imagePath: string): Promise<string> {
  // First preprocess the image to improve OCR results
  const processedImagePath = await preprocessImage(imagePath);
  
  try {
    // Initialize Tesseract worker with language
    const worker = await createWorker('eng');
    
    // Set parameters
    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,()-/ ',
      preserve_interword_spaces: '1',
    });
    
    // Recognize text from image
    const { data: { text } } = await worker.recognize(processedImagePath);
    
    // Terminate the worker
    await worker.terminate();
    
    // Clean up processed image if it's different from original
    if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from prescription:', error);
    
    // Clean up processed image in case of error
    if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }
    
    throw new Error('Failed to extract text from prescription');
  }
}

/**
 * Extracts medicine names from OCR text using pattern matching
 */
export function extractMedicineNames(text: string): string[] {
  // This is a simplified version - in a real app, this would use 
  // more sophisticated NLP techniques or a medical terms database
  
  // Common medicine name patterns (simplified)
  const lines = text.split('\n');
  const medicineNames: string[] = [];
  
  // Look for typical prescription patterns
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check for common medicine formats
    // 1. Capitalized words followed by strength (e.g., "Amoxicillin 500mg")
    // 2. Words followed by common dosage forms (tab, cap, mg, ml)
    const medicinePattern = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)[\s-]*([\d\.]+\s*(?:mg|mcg|g|ml|tab|cap|tablet|capsule|injection|syrup))/i;
    const match = trimmedLine.match(medicinePattern);
    
    if (match) {
      medicineNames.push(match[0]);
    }
  }
  
  return medicineNames;
}

/**
 * Main function to process prescription image and extract information
 */
export async function processPrescriptionImage(imagePath: string): Promise<{
  rawText: string;
  medicines: string[];
}> {
  try {
    // Extract text from the prescription image
    const extractedText = await extractTextFromPrescription(imagePath);
    
    // Extract medicine names from the text
    const medicineNames = extractMedicineNames(extractedText);
    
    return {
      rawText: extractedText,
      medicines: medicineNames
    };
  } catch (error) {
    console.error('Error processing prescription:', error);
    throw error;
  }
}