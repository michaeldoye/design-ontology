import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import type { DomainName } from "../../core/types.js";
import { searchNodes } from "../../core/graph.js";

const NO_ONTOLOGY = {
  content: [
    {
      type: "text" as const,
      text: JSON.stringify({
        error:
          "No ontology loaded. Use generate_ontology to create one, or set ONTOLOGY_PATH.",
      }),
    },
  ],
};

export function registerSearch(
  server: McpServer,
  state: { graph: OntologyGraph | null }
): void {
  server.registerTool(
    "search",
    {
      description:
        "Search the design ontology by keyword or concept. Returns nodes matching your query, optionally filtered by domain (intents, psychology, culture, emotions, audience, visual_properties, accessibility). Use this when you need to find relevant design reasoning but don't know the specific node ID.",
      inputSchema: {
        query: z.string().describe("Free text search query"),
        domain: z
          .string()
          .optional()
          .describe(
            "Optionally filter to one domain group (e.g., visual_properties)"
          ),
      },
    },
    async ({ query, domain }) => {
      if (!state.graph) return NO_ONTOLOGY;

      const domainFilter = domain as DomainName | undefined;
      const results = searchNodes(state.graph, query, domainFilter);

      const enriched = results.map((node) => ({
        ...node,
        domain: state.graph!.domainIndex.get(node.id as string),
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { query, domain: domain ?? "all", results: enriched },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
