
I'm using the DeepSeek-R1 8 billion parameter model.

- test installation with:
```http
POST /api/generate HTTP/1.1
Host: localhost:11434
Content-Type: application/json
Content-Length: 78

{
  "model": "deepseek-r1:8b",
  "prompt":" Why is the colour of sea blue ?"
}
```

- mxbai-embed-large installation test:
```http
POST /api/embed HTTP/1.1
Host: localhost:11434
Content-Type: application/json
Content-Length: 80

{
  "model": "mxbai-embed-large",
  "input":" Why is the colour of sea blue ?"
}
```



[embedding models](https://ollama.com/blog/embedding-models)

# Dependencies

```
brew install pgvector
```

