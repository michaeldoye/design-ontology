#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadOntology } from "./loader.js";
import { registerGetNode } from "./tools/get-node.js";
import { registerGetChain } from "./tools/get-chain.js";
import { registerTraverse } from "./tools/traverse.js";
import { registerCheckAntiPatterns } from "./tools/check-anti-patterns.js";
import { registerResolveForComponent } from "./tools/resolve-properties.js";
import { registerSearch } from "./tools/search-nodes.js";
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

let ontologyResult;
try {
  ontologyResult = loadOntology(ontologyPath);
} catch (err) {
  process.stderr.write(
    `design-ontology MCP server failed to start: ${(err as Error).message}\n`
  );
  process.exit(1);
}

const { ontology, graph } = ontologyResult;

const nodeCount = DOMAIN_NAMES.reduce(
  (sum, d) => sum + Object.keys(ontology.nodes[d] ?? {}).length,
  0
);
const chainCount = ontology.edges.reasoning_chains.length;

process.stderr.write(
  `design-ontology MCP server started: ${nodeCount} nodes, ${chainCount} chains loaded from ${ontologyPath}\n`
);

const server = new McpServer({
  name: "design-ontology",
  version: "0.1.0",
});

// Register all tools
registerGetNode(server, graph);
registerGetChain(server, graph);
registerTraverse(server, graph);
registerCheckAntiPatterns(server, graph);
registerResolveForComponent(server, graph);
registerSearch(server, graph);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
