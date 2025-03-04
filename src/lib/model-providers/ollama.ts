import { Ollama } from 'ollama';
import { ChatMessage, ModelProvider, StreamingResponse } from './types';

export const ollama = new Ollama({host: 'http://ollama:11434'})

export const ollamaProvider: ModelProvider = {
  id: 'ollama',
  name: 'Ollama',
  models: ['deepseek-r1:1.5b', 'deepseek-r1:8b', 'llama3:8b'],
  
  getModels: async function(): Promise<string[] | { error: string, code: number }> {
    try {
      const response = await ollama.list();
      
      if (response && Array.isArray(response.models)) {
        // Extract model names and filter out non-chat models
        const modelNames = response.models
          .map(model => model.name)
          .filter(name => {
            const lowerName = name.toLowerCase();
            // Exclude embedding, audio, and image generation models
            return !lowerName.includes('embed') && 
                   !lowerName.includes('audio') &&
                   !lowerName.includes('whisper') &&
                   !lowerName.includes('tts') &&
                   !lowerName.includes('image') &&
                   !lowerName.includes('dall-e') &&
                   !lowerName.includes('stable-diffusion') &&
                   !lowerName.includes('clip');
          });
          
        return modelNames.length > 0 ? modelNames : this.models;
      }
      
      return this.models;
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      
      // Check if it's a connection error (Ollama not running)
      if (error instanceof Error && 
         (error.message.includes('ECONNREFUSED') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('connect'))) {
        return { 
          error: 'Cannot connect to Ollama. Please make sure Ollama is running.', 
          code: 503 
        };
      }
      
      return { 
        error: 'Failed to fetch models. Please try again later.', 
        code: 500 
      };
    }
  },
  
  chat: async function(model: string, messages: ChatMessage[]): Promise<StreamingResponse> {
    const ollamaResponse = await ollama.chat({
      model,
      messages,
      stream: true
    });
    
    return {
      stream: ollamaResponse,
      processChunk: (part: unknown) => {
        const typedPart = part as { message: { content: string } };
        return {
          content: typedPart.message.content,
          done: false
        };
      }
    };
  }
}; 