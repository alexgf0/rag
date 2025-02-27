"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { FileIcon, FileTextIcon, ImageIcon, Fingerprint, Check, LoaderCircle} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { EmbeddingVector } from "@/lib/db/embeddings"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type File = {
  name: string
  size: number
  type: string
  createdAt: string
  updatedAt: string
  embedding?: EmbeddingVector
}

interface FileManagerProps {
  onFileSelect: (file: string) => void
  onFileDeleted: () => void
}

export default function FileManager({ onFileSelect, onFileDeleted }: FileManagerProps) {
  const [files, setFiles] = useState<File[]>([])
  const [fileNameLoading, setFileNameLoading] = useState<string | undefined>()
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

  const calculateEmbeddings = async (filename: string) => {
    if (fileNameLoading) {
      toast.warning("An embedding is already being loaded")
      return
    }
    setFileNameLoading(filename)
    try {
      const response = await fetch(`/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: filename }),
      })

      if (response.ok) {
        const data = await response.json() as EmbeddingVector
        toast.success(`Embeddings generated for ${filename}`)
        // Update the file's embedding status locally
        setFiles(prevFiles => 
          prevFiles.map(file => 
            file.name === filename ? { ...file, embedding: data } : file
          )
        )
      } else {
        toast.error(`Could not generate embeddings for ${filename}\nError: ${response.status}`)
      }
    } catch (error) {
      toast.error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFileNameLoading(undefined)
    }
  }

  const filteredFiles = files.length > 0 ? files.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase())) : []

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
                <div className="flex flex-col gap-1 justify-center">
                  <p className="font-medium">{file.name}</p>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    {file.embedding ? (
                      <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-100 relative px-2 py-1">
                             <Fingerprint className="w-4 h-4" />
                             <div className="absolute -top-1 -right-1 bg-white rounded-full">
                               <Check className="w-3 h-3 text-green-600" />
                             </div>
                           </Badge>
                         </TooltipTrigger>
                         <TooltipContent className="p-3">
                           <p className="text-xs">Embeddings calculated</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                    ) : (
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                onClick={() => calculateEmbeddings(file.name)} 
                                variant="outline" 
                                size="sm"
                                className="h-fit py-1"
                              >
                                {
                                  fileNameLoading == file.name ? (
                                    <div className="flex gap-2 items-center">
                                      <LoaderCircle className="w-4 h-4 animate-spin" />
                                      Loading...
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 items-center">
                                      <Fingerprint className="w-4 h-4" />
                                      Calculate
                                    </div>
                                  )
                                }
                              </Button>
                              </TooltipTrigger>
                              <TooltipContent className="p-3">

                                {
                                  fileNameLoading == file.name ? (
                                  <p className="text-xs">Calculating embeddings... may take a while</p>
                                  ): (
                                  <p className="text-xs">Calculate embeddings for {file.name}</p>)
                                }

                              </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
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