"use client"

import { useState, useCallback } from "react"
import FileUpload from "./components/file-upload"
import FileManager from "./components/file-manager"
import PDFViewer from "./components/pdf-viewer"
import ChatInterface from "./components/chat-interface"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1)
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-1/2 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">File Management</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} size="icon" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ModeToggle />
          </div>
        </div>
        <FileUpload onUploadComplete={handleRefresh} />
        <Separator className="mb-4" />
        <FileManager key={refreshKey} onFileSelect={setSelectedFile} onFileDeleted={handleRefresh} />
        {selectedFile && <PDFViewer file={selectedFile} />}
      </div>
      <div className="w-1/2 border-l border-border">
        <ChatInterface />
      </div>
    </div>
  )
}

