"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PDFViewer({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchPdf = async () => {
      const response = await fetch(`/api/files/${file}`)
      if (response.ok) {
        const blob = await response.blob()
        setPdfUrl(URL.createObjectURL(blob))
      }
    }
    fetchPdf()
  }, [file])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  if (!pdfUrl) {
    return <div>Loading PDF...</div>
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
        <div className="flex items-center justify-between mt-4">
          <p>
            Page {pageNumber} of {numPages}
          </p>
          <div>
            <Button
              variant="outline"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(pageNumber - 1)}
              className="mr-2"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={numPages !== null && pageNumber >= numPages}
              onClick={() => setPageNumber(pageNumber + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

