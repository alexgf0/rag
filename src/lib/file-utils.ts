import fs from "fs"
import path from "path"
import pdfParse from 'pdf-parse';

export const uploadsDir = path.join(process.cwd(), "/public/uploads")

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}

export async function ensureFileExists(filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    const filePath = uploadsDir + "/"+ filename
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err)
    })
  })
}



export async function extractFileContents(filename: string): Promise<string> {
  const filePath = uploadsDir + "/"+ filename
  try {
    // Read the PDF file as a buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    // Get the text content
    let text: string = data.text;
    
    // Sanitize the text:
    // 1. Remove null bytes (0x00)
    text = text.replace(/\0/g, '');
    
    // 2. Replace other potentially problematic characters
    text = text.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
    
    // 3. Ensure valid UTF-8 by replacing invalid characters with spaces
    text = text.replace(/[^\x20-\x7E\x0A\x0D\u00A0-\uFFFC]/g, ' ');
    
    return text;
  } catch (error) {
      throw new Error(`Failed to extract PDF text: ${error}`);
  }
}
