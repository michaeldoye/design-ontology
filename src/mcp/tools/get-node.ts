import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import { getNode, getConnections, getChainsForNode } from "../../core/graph.js";

export function registerGetNode(server: McpServer, graph: OntologyGraph): void {
  server.registerTool(
    "get_node",
    {
      description:
        "Retrieve a design ontology node by ID. Returns the node's full description, reasoning, connections to other nodes, and which reasoning chains it participates in. Use this to understand WHY a specific design decision exists.",
      inputSchema: {
        node_id: z.string().describe("The node ID to retrieve (e.g., INT-001, VIS-003)"),
      },
    },
    async ({ node_id }) => {
      const node = getNode(graph, node_id);

      if (!node) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Node not found", node_id }),
            },
          ],
        };
      }

      const domain = graph.domainIndex.get(node_id);
      const incomingNodes = getConnections(graph, node_id, "in");
      const outgoingNodes = getConnections(graph, node_id, "out");
      const chains = getChainsForNode(graph, node_id);

      const result = {
        ...node,
        domain,
        incoming_connections: incomingNodes.map((n) => n.id),
        outgoing_connections: outgoingNodes.map((n) => n.id),
        chains: chains.map((c) => c.name),
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
