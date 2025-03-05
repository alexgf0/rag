import fs from "fs"
import path from "path"
import pdfParse from 'pdf-parse';
import { normalizeSpaces, splitStringByLength } from "./utils";

export const uploadsDir = path.join(process.cwd(), "uploads")

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

// Helper function to detect if text is likely gibberish
function isLikelyGibberish(text: string): boolean {
  if (text.length < 100) return false; // Skip short texts
  
  // Check for lack of spaces (gibberish often has very few spaces)
  const spacesRatio = (text.match(/ /g) || []).length / text.length;
  if (spacesRatio > 0.1) return false;
  
  const commonWords = ['the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'not', 'page', 'chapter'];
  const wordMatches = commonWords.filter(word => 
    text.toLowerCase().includes(` ${word} `) || 
    text.toLowerCase().startsWith(`${word} `)
  );
  // Only consider it gibberish if both space ratio is low AND common words are missing
  if (wordMatches.length < 1 && text.length > 2000) return true;
  
  // Check for extremely long strings without spaces (a clear sign of encoding issues)
  const maxNoSpaceLength = text.split(' ')
    .map(word => word.length)
    .reduce((max, len) => Math.max(max, len), 0);
  
  if (maxNoSpaceLength > 100) return true; // Only flag extremely long "words"
  
  return false;
}

async function extractPDFContents(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  if (isLikelyGibberish(data.text)) {
    // Return a special error message that will be detected by the calling code
    return "[[PDF_EXTRACTION_ERROR: This PDF could not be properly extracted. It may be encrypted, scanned, or using a non-standard encoding.]]";
  }
  
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
        // Check for the special error message
        if (text.startsWith("[[PDF_EXTRACTION_ERROR:")) {
          throw new Error(text.replace("[[PDF_EXTRACTION_ERROR:", "").replace("]]", ""));
        }
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