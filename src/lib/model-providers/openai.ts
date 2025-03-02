import OpenAI from 'openai';
import { ModelProvider, ChatMessage, StreamingResponse } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const openaiProvider: ModelProvider = {
  id: 'openai',
  name: 'OpenAI',
  models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  
  getModels: async function(): Promise<string[] | { error: string, code: number }> {
    try {
      const response = await openai.models.list();
      
      // Filter for chat models only
      const chatModels = response.data
        .filter(model => {
          // Only include models that start with "gpt-" and don't include "instruct"
          // This targets models designed for chat completions
          return model.id.startsWith('gpt-') && 
                 !model.id.includes('instruct') && 
                 !model.id.includes('audio') &&
                 !model.id.includes('whisper') &&
                 !model.id.includes('tts') &&
                 !model.id.includes('embedding') &&
                 !model.id.includes('search');
        })
        .map(model => model.id);
      
      // Sort models to put GPT-4 models first, then 3.5
      const sortedModels = chatModels.sort((a, b) => {
        if (a.includes('gpt-4') && !b.includes('gpt-4')) return -1;
        if (!a.includes('gpt-4') && b.includes('gpt-4')) return 1;
        return a.localeCompare(b);
      });
      
      return sortedModels.length > 0 ? sortedModels : this.models;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      
      // Check for authentication errors more comprehensively
      if (
        (error instanceof Error && error.message.includes('401')) ||
        (error && typeof error === 'object' && 'status' in error && error.status === 401) ||
        (error && typeof error === 'object' && 'code' in error && error.code === 'invalid_api_key')
      ) {
        return { 
          error: 'Authentication failed. Please configure your OpenAI API key.', 
          code: 401 
        };
      }
      
      return { 
        error: 'Failed to fetch models. Please try again later.', 
        code: 500 
      };
    }
  },
  
  chat: async function(model: string, messages: ChatMessage[]): Promise<StreamingResponse<unknown, unknown>> {
    const openaiMessages = messages.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 
             msg.role === 'assistant' ? 'assistant' : 
             'system') as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
    
    const stream = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      stream: true
    });
    
    return {
      stream,
      processChunk: (chunk: unknown) => {
        const typedChunk = chunk as {
          choices: Array<{
            delta?: { content?: string };
            finish_reason?: string;
          }>;
        };
        
        return {
          content: typedChunk.choices[0]?.delta?.content || '',
          done: typedChunk.choices[0]?.finish_reason === 'stop'
        };
      }
    };
  }
}; 