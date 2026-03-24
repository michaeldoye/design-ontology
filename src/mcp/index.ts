#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync } from "node:fs";
import { loadOntology } from "./loader.js";
import { registerGetNode } from "./tools/get-node.js";
import { registerGetChain } from "./tools/get-chain.js";
import { registerTraverse } from "./tools/traverse.js";
import { registerCheckAntiPatterns } from "./tools/check-anti-patterns.js";
import { registerResolveForComponent } from "./tools/resolve-properties.js";
import { registerSearch } from "./tools/search-nodes.js";
import { registerGenerateOntology } from "./tools/generate-ontology.js";
import type { OntologyGraph } from "../core/graph.js";
import type { DomainName } from "../core/types.js";

const DOMAIN_NAMES: DomainName[] = [
  "intents",
  "psychology",
  "culture",
  "emotions",
  "audience",
  "visual_properties",
  "accessibility",
];

const ontologyPath = process.env.ONTOLOGY_PATH ?? "./design-ontology.json";

// Shared mutable state — generate_ontology/save_ontology update the graph,
// and query tools read from it.
const state: { graph: OntologyGraph | null; ontologyPath: string } = {
  graph: null,
  ontologyPath,
};

// Try to load existing ontology, but don't fail if it doesn't exist
if (existsSync(ontologyPath)) {
  try {
    const result = loadOntology(ontologyPath);
    state.graph = result.graph;

    const nodeCount = DOMAIN_NAMES.reduce(
      (sum, d) =>
        sum + Object.keys(result.ontology.nodes[d] ?? {}).length,
      0
    );
    const chainCount = result.ontology.edges.reasoning_chains.length;
    process.stderr.write(
      `design-ontology MCP server started: ${nodeCount} nodes, ${chainCount} chains loaded from ${ontologyPath}\n`
    );
  } catch (err) {
    process.stderr.write(
      `Warning: Could not load ${ontologyPath}: ${(err as Error).message}\n` +
        `Server started without an ontology. Use generate_ontology to create one.\n`
    );
  }
} else {
  process.stderr.write(
    `design-ontology MCP server started (no ontology loaded).\n` +
      `Use the generate_ontology tool to create one, or set ONTOLOGY_PATH to an existing file.\n`
  );
}

const server = new McpServer({
  name: "design-ontology",
  version: "0.1.5",
});

// Register generate/save tools (always available)
registerGenerateOntology(server, state);

// Register query tools — they check state.graph at call time
registerGetNode(server, state);
registerGetChain(server, state);
registerTraverse(server, state);
registerCheckAntiPatterns(server, state);
registerResolveForComponent(server, state);
registerSearch(server, state);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
