import fs from "fs"
import path from "path"
import pdfParse from 'pdf-parse';
import { normalizeSpaces, splitStringByLength } from "./utils";

export const uploadsDir = path.join(process.cwd(), "/public/uploads")

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}

export async function ensureFileExists(filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    const filePath = path.join(uploadsDir, filename)
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err)
    })
  })
}

async function extractPDFContents(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function extractTextContents(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf8');
}

export async function extractFileContents(filename: string): Promise<string[]> {
  const filePath = path.join(uploadsDir, filename);
  const ext = path.extname(filename).toLowerCase();

  try {
    let text: string;

    switch (ext) {
      case '.pdf':
        text = await extractPDFContents(filePath);
        break;
      case '.txt':
        text = await extractTextContents(filePath);
        break
      case '.md':
        text = await extractTextContents(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    // Sanitize the text
    text = text.replace(/\0/g, ''); // Remove null bytes
    text = text.replace(/[\uFFFD\uFFFE\uFFFF]/g, ''); // Remove problematic characters
    text = text.replace(/[^\x20-\x7E\x0A\x0D\u00A0-\uFFFC]/g, ''); // Ensure valid UTF-8
    text = normalizeSpaces(text); // Normalize spaces

    return splitStringByLength(text, 8192);
  } catch (error) {
    throw new Error(`Failed to extract contents from ${filename}: ${error}`);
  }
}