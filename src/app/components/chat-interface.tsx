"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, EyeOff, FileCheck, FileX, SquarePen } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Message = {
  id: number
  text: string
  sender: "user" | "system"
  complete?: boolean
  hasThinkContent?: boolean
  originalText?: string
}

// Add these fallback model options
const modelProviders = [
  {
    id: 'ollama',
    name: 'Ollama',
    models: [
      { id: 'deepseek-r1:1.5b', name: 'DeepSeek R1 (1.5B)' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 (8B)' },
      { id: 'llama3:8b', name: 'Llama 3 (8B)' }
    ]
  },
  {
    id: 'claude',
    name: 'Claude',
    models: [
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  }
];

export default function ChatInterface() {
  const initialWelcomeMessage = { 
    id: 1, 
    text: "Welcome to the chat! Ask me anything.", 
    sender: "system", 
    complete: true 
  }
  
  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage as Message])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showThinking, setShowThinking] = useState(true)
  const [includeFiles, setIncludeFiles] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState(40) // Default height in pixels
  const [isInitialized, setIsInitialized] = useState(false) // Track initial render
  const messageEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('deepseek-r1:1.5b');
  const [availableModels, setAvailableModels] = useState(modelProviders[0].models);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Scroll to bottom of messages - forced on first render
  const scrollToBottom = (force = false) => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ 
        behavior: force ? "auto" : "smooth",
        block: "end"
      })
    }
  }

  // Handle initial layout and scroll
  useEffect(() => {
    // Set initial layout
    const initializeLayout = () => {
      if (!isInitialized) {
        // Force immediate scroll on first render
        setTimeout(() => {
          scrollToBottom(true)
          setIsInitialized(true)
        }, 100) // Short delay to ensure DOM is ready
      }
    }

    initializeLayout()
  }, [isInitialized])

  // Handle scroll when messages change
  useEffect(() => {
    if (isInitialized) {
      scrollToBottom()
    }
  }, [messages, isInitialized])

  // Function to auto-resize the textarea and adjust the chat area
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to properly calculate the new height
      textarea.style.height = 'auto'
      
      // Calculate new height (capped at maximum)
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200)
      textarea.style.height = `${newHeight}px`
      
      // Update height state to resize the chat area
      setTextareaHeight(newHeight)
    }
  }

  // Resize the textarea when input changes
  useEffect(() => {
    autoResizeTextarea()
  }, [input])

  const transformMessagesForOllama = (messages: Message[]) => {
    // Skip the welcome message and transform remaining messages
    return messages.slice(1).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }))
  }

  // Function to reset the chat
  const resetChat = () => {
    setMessages([initialWelcomeMessage as Message])
    setInput("")
    setIsLoading(false)
    setTextareaHeight(40) // Reset textarea height
    
    // Ensure scroll position is reset properly
    setTimeout(() => scrollToBottom(true), 50)
  }

  // Function to process and extract think sections from text
  const processThinkSections = (text: string): { 
    processedText: string, 
    hasThinkContent: boolean,
    originalText: string 
  } => {
    const originalText = text
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g
    
    // Check if there are think tags
    const hasThinkContent = thinkRegex.test(text)
    
    if (!hasThinkContent) {
      return { processedText: text, hasThinkContent, originalText }
    }
    
    // Reset regex state
    thinkRegex.lastIndex = 0
    
    // For compressed view, we'll remove the think sections completely
    const processedText = text.replace(thinkRegex, '')
      // Clean up any double newlines left by the removal
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
    
    return { processedText, hasThinkContent, originalText }
  }

  // Toggle thinking visibility for all messages
  const toggleThinking = () => {
    setShowThinking(prev => !prev)
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.hasThinkContent) {
          return {
            ...msg,
            text: !showThinking ? msg.originalText! : processThinkSections(msg.originalText!).processedText
          }
        }
        return msg
      })
    )
  }

  // Handle key press for submitting with Enter (but allow Shift+Enter for new lines)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  // Fetch available models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelError(null); // Reset error state
      
      try {
        const response = await fetch(`/api/models?provider=${selectedProvider}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        
        const data = await response.json();
        
        // Check if we received an error message
        if (data.error) {
          setModelError(data.error);
          
          // Still use the fallback models for the UI
          const provider = modelProviders.find(p => p.id === selectedProvider);
          if (provider) {
            setAvailableModels(provider.models);
            setSelectedModel(provider.models[0].id);
          }
          return;
        }
        
        if (data.models && Array.isArray(data.models)) {
          // Convert API response to the format needed for the UI
          const formattedModels = data.models.map((modelId: string) => ({
            id: modelId,
            name: formatModelName(modelId)
          }));
          
          setAvailableModels(formattedModels);
          
          // Set the first model as selected if the current selection isn't available
          const modelExists = formattedModels.some((model: { id: string; name: string }) => model.id === selectedModel);
          if (!modelExists && formattedModels.length > 0) {
            setSelectedModel(formattedModels[0].id);
          }
        } else {
          // Fallback to static models if API doesn't return expected format
          const provider = modelProviders.find(p => p.id === selectedProvider);
          if (provider) {
            setAvailableModels(provider.models);
            setSelectedModel(provider.models[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fallback to static models on error
        const provider = modelProviders.find(p => p.id === selectedProvider);
        if (provider) {
          setAvailableModels(provider.models);
          setSelectedModel(provider.models[0].id);
        }
        setModelError('Failed to fetch available models');
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchModels();
  }, [selectedProvider]);
  
  // Helper function to format model IDs into readable names
  const formatModelName = (modelId: string): string => {
    // Try to extract a readable name from the model ID
    // Example: "claude-3-opus-20240229" -> "Claude 3 Opus"
    const parts = modelId.split('-');
    
    if (modelId.includes('claude')) {
      // Handle Claude models
      // Remove date suffix if present (e.g., 20240229)
      const withoutDate = parts.filter(part => !part.match(/^\d{8}$/));
      return withoutDate
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    } else if (modelId.includes('gpt')) {
      // Handle OpenAI models
      return modelId.toUpperCase();
    } else {
      // For other models, just capitalize and join with spaces
      return parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now(),
        text: input.trim(),
        sender: "user",
        complete: true
      }
      
      const aiMessageId = Date.now() + 1
      setMessages(prev => [...prev, userMessage, {
        id: aiMessageId,
        text: "",
        sender: "system",
        complete: false
      }])
      setInput("")
      setIsLoading(true)
      
      // Reset textarea height
      setTextareaHeight(40)
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px'
      }

      try {
        // Get the current conversation history and add the new message
        const conversationHistory = transformMessagesForOllama(messages)
        conversationHistory.push({ role: "user", content: input.trim() })

        // Call the API endpoint with streaming response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: conversationHistory,
            reset: false,
            include_files: includeFiles,
            provider: selectedProvider,
            model: selectedModel
          }),
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is null')
        }

        // Process the incoming stream chunks
        const decoder = new TextDecoder()
        let buffer = ''
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })
          
          // Process complete JSON lines from the buffer
          let newlineIndex
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex)
            buffer = buffer.slice(newlineIndex + 1)
            
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                
                if (data.error) {
                  // Handle stream errors properly by throwing them to the outer catch block
                  const errorMessage = data.error;
                  throw new Error(errorMessage);
                }
                
                // Update the full response and the displayed message
                if (data.content) {
                  fullResponse += data.content
                  
                  // Check if we need to process think sections
                  const { processedText, hasThinkContent } = processThinkSections(fullResponse)
                  
                  // Update the AI message with new content
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          text: showThinking ? fullResponse : processedText,
                          hasThinkContent,
                          originalText: fullResponse
                        }
                      : msg
                  ))
                }
                
                // Mark message as complete when done
                if (data.done) {
                  // Final processing of the complete response
                  const { processedText, hasThinkContent } = processThinkSections(fullResponse)
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          text: showThinking ? fullResponse : processedText,
                          complete: true,
                          hasThinkContent,
                          originalText: fullResponse
                        }
                      : msg
                  ))
                }
              } catch (e) {
                console.error('Error parsing stream:', e, line)
                // Propagate the error to the outer catch block
                if (line.includes("error")) {
                  try {
                    const errorData = JSON.parse(line);
                    if (errorData.error) {
                      throw new Error(errorData.error);
                    }
                  } catch { // If we can't parse the JSON, just throw the original error
                    throw e;
                  }
                } else {
                  throw e;
                }
              }
            }
          }
        }

      } catch (error) {
        console.error('Error:', error)
        
        // Extract and display user-friendly error message
        const errorMessage = "Sorry, I encountered an error. Please try again.";
        
        console.log("ERROR: ", error)
        // Check for specific error patterns
        if (error instanceof Error) {
          console.log("error.message: ", error.message)
          toast.error(error.message)
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: errorMessage, complete: true }
            : msg
        ))
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle reset chat with backend notification
  const handleResetChat = async () => {
    // Notify the backend about the reset
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [],
          reset: true // Signal that this is a reset request
        }),
      })
    } catch (error) {
      console.error('Error notifying reset:', error)
    }
    
    // Reset the chat UI
    resetChat()
  }

  // Render individual message with think toggle if applicable
  const renderMessage = (message: Message) => {
    return (
      <div key={message.id} className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}>
        <span
          className={`inline-block p-2 rounded-lg ${
            message.sender === "user" 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          } ${!message.complete ? "animate-pulse" : ""}`}
        >
          {message.text || "..."}
        </span>
      </div>
    )
  }

  // Calculate dynamic height for chat area that shrinks as textarea grows
  const chatAreaHeight = `calc(100vh - ${textareaHeight + 160}px)`

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <CardTitle>Chat with AI</CardTitle>
          <div className="flex gap-1">
            <Switch 
              id="thinking-mode" 
              checked={showThinking} 
              onCheckedChange={toggleThinking} 
            />
            <Label htmlFor="thinking-mode" className="flex items-center cursor-pointer">
              {showThinking ? (
                <><Eye className="h-4 w-4 mr-1" /> Show Thinking</>
              ) : (
                <><EyeOff className="h-4 w-4 mr-1" /> Show Thinking</>
              )}
            </Label>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetChat}
            disabled={isLoading}
            className="flex items-center"
          >
            <SquarePen className="h-4 w-4" />
            New Chat
          </Button>
          
          {/* Add model selection UI */}
          <div className="flex items-center gap-2">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {modelProviders.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoadingModels}>
              <SelectTrigger className="w-[180px]">
                {isLoadingModels ? (
                  <div className="flex items-center">
                    <span className="animate-spin mr-2">⟳</span>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Model" />
                )}
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3">
            <Switch 
              id="include-files" 
              checked={includeFiles} 
              onCheckedChange={setIncludeFiles} 
            />
            <Label htmlFor="include-files" className="flex items-center cursor-pointer gap-2">
              {includeFiles ? (
                <><FileCheck className="h-4 w-4 mr-1" /> Include files</>
              ) : (
                <><FileX className="h-4 w-4 mr-1" />Include files</>
              )}
            </Label>
          </div>
        </div>
        
        {/* Display API key configuration message */}
        {modelError && (selectedProvider === 'claude' || selectedProvider === 'openai') && (
          <div className="text-xs text-red-500 mt-1">
            {modelError}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pr-3 overflow-hidden">
        {/* Use dynamic height that adjusts based on textarea size */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="pr-4"
          style={{ height: chatAreaHeight }}
        >
          <div className="flex flex-col space-y-4 min-h-[50px]">
            {messages.map(renderMessage)}
            <div ref={messageEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-2">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2 items-end">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              placeholder="Type a message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="resize-none pr-12 py-2"
              style={{ 
                height: `${textareaHeight}px`,
                minHeight: '40px',
                maxHeight: '200px',
                overflowY: textareaHeight >= 200 ? 'auto' : 'hidden'
              }}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}