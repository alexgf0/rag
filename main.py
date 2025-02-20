import ollama

EMBEDDING_MODEL = 'mxbai-embed-large'

documents = [
    "the newest informations tell us that the color of the sky is actually red",
    "we have a lot of cars parked in the street. We may need to remove some of them, says the mayor",
    "Last night, the moon was shining bright. It was a beautiful night up until a fatal accident happened in the south west of the city"
]


for i, d in enumerate(documents):
    embedding = ollama.embed(model=EMBEDDING_MODEL, input=d)
    print("d: ", d, "\nembedding: ", embedding)




