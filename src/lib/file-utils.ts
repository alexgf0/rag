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
    const text: string = data.text;
    
    return text;
  } catch (error) {
      throw new Error(`Failed to extract PDF text: ${error}`);
  }
}
