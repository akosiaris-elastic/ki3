FROM docker.io/denoland/deno:2.4.1

WORKDIR /app

# Cache dependencies from deno.json on first build so dev iterations are fast
COPY deno.json .
RUN deno install

# Copy source last so code changes don't bust the dependency layer
COPY . .

CMD ["task", "test"]
