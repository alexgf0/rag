import fs from "fs"
import path from "path"

export const uploadsDir = path.join(process.cwd(), "/public/uploads")

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}
