import ollama from 'ollama'
import { EmbeddingUtils, EmbeddingVector } from './db/embeddings';


export async function getRelevantContent(model: string, query: string, limit: number = 3): Promise<EmbeddingVector[]> {
    const queryEmbedding = await ollama.embed({
        model: 'mxbai-embed-large',
        input: query
    });

    const queryVector = queryEmbedding.embeddings[0];

    const vals = await EmbeddingUtils.getByCosineDistance(queryVector, model, limit)

    return vals ?? [] 
}
