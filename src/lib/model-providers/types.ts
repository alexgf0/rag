export interface ChatMessage {
  role: string;
  content: string;
}

export interface StreamChunkResponse {
  content: string;
  done: boolean;
}

export interface StreamingResponse<T = unknown, C = unknown> {
  stream: T;
  processChunk: (chunk: C) => StreamChunkResponse;
}

export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  getModels?: () => Promise<string[]>;
  chat: (model: string, messages: ChatMessage[]) => Promise<StreamingResponse<unknown, unknown>>;
} 