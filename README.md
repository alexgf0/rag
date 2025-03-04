# How to run
You should have ollama install as a container or [follow the install instructions](https://ollama.com/blog/ollama-is-now-available-as-an-official-docker-image)

Create the `nextjs` container and the `DB` container by executing the following in the root directory:
```bash
docker compose up --build -d
```

Once the containers have been created connect the ollama container to the docker network with:
```bash
docker network connect rag_app_network ollama
```

Open your browser and go to `http://localhost:3000`.



