import ollama from 'ollama'
import { EmbeddingUtils } from './db/embeddings';


export async function getRelevantContent(model: string, query: string, limit: number = 5) {
    console.log("the query is: |", query, "|")

    // Get query embedding
    const queryEmbedding = await ollama.embed({
        model: 'mxbai-embed-large',
        input: query
    });

    console.log("queryEmbeddings: ", queryEmbedding)

    
    // Assuming queryEmbedding.embeddings is number[][]
    const queryVector = queryEmbedding.embeddings[0]; // Take first embedding if it's an array of embeddings

    console.log("\n\n\nqueryVector: ", queryVector)

    for (let i=0; i<queryVector.length; i++) {
        if (queryVector[i] != 0) {
            // console.log("Something different from 0")
        }
    }

    const vals = await EmbeddingUtils.getByCosineDistance(queryVector, model, limit)

    console.log("\n\n got vals: ", vals)
}
