import { NextResponse } from 'next/server';
import { claudeProvider } from '@/lib/model-providers/claude';
import { ollamaProvider } from '@/lib/model-providers/ollama';
import { openaiProvider } from '@/lib/model-providers/openai';

const providers = {
  ollama: ollamaProvider,
  claude: claudeProvider,
  openai: openaiProvider
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    
    // If provider is specified, return models for that provider
    if (provider && provider in providers) {
      const selectedProvider = providers[provider as keyof typeof providers];
      
      // Use getModels if available, otherwise return the static list
      if (selectedProvider.getModels) {
        const models = await selectedProvider.getModels();
        
        // Check if we got an error object instead of models array
        if (models && typeof models === 'object' && 'error' in models) {
          return NextResponse.json({ 
            error: models.error,
            code: models.code 
          }, { status: 200 }); // Send 200 so frontend can handle the message
        }
        
        return NextResponse.json({ models });
      } else {
        return NextResponse.json({ models: selectedProvider.models });
      }
    }
    
    // If no provider specified, return all providers with their models
    const allProviders: Record<string, string[]> = {};
    
    for (const [key, provider] of Object.entries(providers)) {
      if (provider.getModels) {
        const models = await provider.getModels();
        
        // Handle error response
        if (models && typeof models === 'object' && 'error' in models) {
          allProviders[key] = [];
        } else {
          allProviders[key] = models as string[];
        }
      } else {
        allProviders[key] = provider.models;
      }
    }
    
    return NextResponse.json({ providers: allProviders });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 