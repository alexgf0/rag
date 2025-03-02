import OpenAI from 'openai';
import { ModelProvider, ChatMessage, StreamingResponse } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const openaiProvider: ModelProvider = {
  id: 'openai',
  name: 'OpenAI',
  models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  
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