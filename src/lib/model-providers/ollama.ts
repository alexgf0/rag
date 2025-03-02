import ollama from 'ollama';
import { ChatMessage, ModelProvider, StreamingResponse } from './types';

export const ollamaProvider: ModelProvider = {
  id: 'ollama',
  name: 'Ollama',
  models: ['deepseek-r1:1.5b', 'deepseek-r1:8b', 'llama3:8b'],
  
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