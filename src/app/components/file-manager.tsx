"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { FileIcon, FileTextIcon, ImageIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type File = {
  name: string
  size: number
  type: string
  createdAt: string
  updatedAt: string
}

interface FileManagerProps {
  onFileSelect: (file: string) => void
  onFileDeleted: () => void
}

export default function FileManager({ onFileSelect, onFileDeleted }: FileManagerProps) {
  const [files, setFiles] = useState<File[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      } else {
        throw new Error("Failed to fetch files")
      }
    } catch {
      toast.error("Failed to fetch files")
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${filename}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("File deleted successfully")
        onFileDeleted()
      } else {
        throw new Error("Failed to delete file")
      }
    } catch {
      toast.error("Failed to delete file")
    }
  }

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileTextIcon className="w-6 h-6 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="w-6 h-6 text-green-500" />
      default:
        return <FileIcon className="w-6 h-6 text-blue-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="mb-4 space-y-4">
      <Input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="space-y-2">
        {filteredFiles.map((file) => (
          <Card key={file.name}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                {getFileIcon(file.type)}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => onFileSelect(file.name)} variant="secondary" size="sm">
                  View
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the file &quot;{file.name}&quot; from the
                        server.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(file.name)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

