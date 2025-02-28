"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FileUploadProps {
  onUploadComplete: () => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("File uploaded successfully")
          setFile(null)
          onUploadComplete()
        } else {
          throw new Error(data.message || "Upload failed")
        }
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file")
    }
  }

  return (
    <div className="mb-4 flex items-center gap-4">
      <Input type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={!file}>
        Upload
      </Button>
    </div>
  )
}

