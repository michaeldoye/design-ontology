import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import { getNode } from "../../core/graph.js";

export function registerGetChain(server: McpServer, graph: OntologyGraph): void {
  server.registerTool(
    "get_chain",
    {
      description:
        "Retrieve a design reasoning chain. Returns the full traversal path from user intent through psychology, culture, and audience to concrete visual properties, with every node expanded. Use this before generating any UI component to understand the reasoning behind design decisions.",
      inputSchema: {
        chain_id: z
          .string()
          .optional()
          .describe("Chain ID (e.g., CHAIN-001)"),
        chain_name: z
          .string()
          .optional()
          .describe("Chain name (case-insensitive partial match)"),
      },
    },
    async ({ chain_id, chain_name }) => {
      if (!chain_id && !chain_name) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Provide at least one of chain_id or chain_name",
              }),
            },
          ],
        };
      }

      const chains = graph.ontology.edges.reasoning_chains;
      let match = chain_id
        ? chains.find((c) => c.id === chain_id)
        : undefined;

      if (!match && chain_name) {
        const lower = chain_name.toLowerCase();
        match = chains.find((c) => c.name.toLowerCase().includes(lower));
      }

      if (!match) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Chain not found",
                chain_id,
                chain_name,
              }),
            },
          ],
        };
      }

      const expandedPath = match.path.map((nodeId) => {
        const node = getNode(graph, nodeId as string);
        return node ?? { id: nodeId, error: "Node not found" };
      });

      const result = {
        ...match,
        expanded_path: expandedPath,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
