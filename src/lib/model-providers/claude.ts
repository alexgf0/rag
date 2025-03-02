import Anthropic from '@anthropic-ai/sdk';
import { ModelProvider, ChatMessage, StreamingResponse } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const claudeProvider: ModelProvider = {
  id: 'claude',
  name: 'Claude',
  models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  
  chat: async function(model: string, messages: ChatMessage[]): Promise<StreamingResponse<unknown, unknown>> {
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
    
    const stream = await anthropic.messages.create({
      model,
      messages: claudeMessages,
      max_tokens: 4096,
      stream: true
    });
    
    return {
      stream,
      processChunk: (chunk: unknown) => {
        const typedChunk = chunk as {
          delta?: { text?: string };
          type?: string;
        };
        
        return {
          content: typedChunk.delta?.text || '',
          done: typedChunk.type === 'message_stop'
        };
      }
    };
  }
}; 