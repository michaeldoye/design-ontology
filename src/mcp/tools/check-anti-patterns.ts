import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import { checkAntiPatterns } from "../../core/graph.js";

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

export function registerCheckAntiPatterns(
  server: McpServer,
  state: { graph: OntologyGraph | null }
): void {
  server.registerTool(
    "check_anti_patterns",
    {
      description:
        'Check a proposed design approach against the ontology\'s anti-patterns. Describe what you plan to build in natural language and this tool will flag any design decisions the ontology explicitly prohibits, with reasoning for why they\'re prohibited. Use this BEFORE generating code to avoid known design mistakes.',
      inputSchema: {
        description: z
          .string()
          .describe(
            "Natural language description of the proposed design approach"
          ),
      },
    },
    async ({ description }) => {
      if (!state.graph) return NO_ONTOLOGY;

      const matches = checkAntiPatterns(state.graph, description);

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                matches: [],
                message: "No anti-pattern violations detected",
              }),
            },
          ],
        };
      }

      const result = {
        matches: matches.map((ap) => ({
          label: ap.label,
          description: ap.description,
          why_prohibited: ap.why_prohibited,
          traces_to: ap.traces_to,
        })),
        message: `${matches.length} potential anti-pattern violation(s) detected`,
      };

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
