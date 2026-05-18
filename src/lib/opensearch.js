import { Client } from "@opensearch-project/opensearch";

const client = new Client({
  node: process.env.OPENSEARCH_NODE || "http://localhost:9200",
  // No auth for local development with security disabled in Docker
});

export default client;
