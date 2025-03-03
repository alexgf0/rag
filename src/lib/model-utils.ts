import { EmbeddingUtils, EmbeddingVector } from './db/embeddings';
import { ollama } from './model-providers/ollama';


export async function getRelevantContent(model: string, query: string, limit: number = 3): Promise<EmbeddingVector[]> {
    const queryEmbedding = await ollama.embed({
        model: model,
        input: query
    });

    const queryVector = queryEmbedding.embeddings[0];

    const vals = await EmbeddingUtils.getByCosineDistance(queryVector, model, limit)

    return vals ?? [] 
}
