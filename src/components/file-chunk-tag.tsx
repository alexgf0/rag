"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type FileChunk = {
  filename: string
  content: string
}

export function FileChunkTag({ chunk }: { chunk: FileChunk }) {
  const [isOpen, setIsOpen] = useState(false)

  // Format the filename to be more readable
  const displayName = chunk.filename.length > 15 ? chunk.filename.substring(0, 12) + "..." : chunk.filename

  console.log("\nCHUNK: ", chunk)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 border border-blue-200"
          title={`${chunk.filename}`}
        >
          {displayName}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" side="top">
        <div className="p-2 bg-muted text-xs font-medium border-b">
          <span className="font-bold">{chunk.filename}</span>
        </div>
        <ScrollArea className="h-[250px] p-4">
          <pre className="text-xs whitespace-pre-wrap">{chunk.content}</pre>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

