import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import type { DomainName } from "../../core/types.js";

function traverseToTarget(
  graph: OntologyGraph,
  startIds: string[],
  targetDomain: DomainName,
  maxDepth: number
) {
  const paths: string[][] = [];
  const reachedTargets = new Map<string, object>();
  const reasoningParts: string[] = [];

  for (const startId of startIds) {
    if (!graph.nodeIndex.has(startId)) continue;

    const queue: [string, string[]][] = [[startId, [startId]]];
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const [currentId, currentPath] = queue.shift()!;

      if (
        graph.domainIndex.get(currentId) === targetDomain &&
        currentId !== startId
      ) {
        paths.push([...currentPath]);
        const node = graph.nodeIndex.get(currentId);
        if (node) reachedTargets.set(currentId, node);
        continue;
      }

      if (currentPath.length >= maxDepth) continue;

      const node = graph.nodeIndex.get(currentId);
      if (node?.reasoning && !reasoningParts.includes(node.reasoning)) {
        reasoningParts.push(node.reasoning);
      }

      for (const nextId of graph.outgoing.get(currentId) ?? []) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push([nextId, [...currentPath, nextId]]);
        }
      }
    }
  }

  return {
    paths,
    target_nodes: Array.from(reachedTargets.values()),
    reasoning_summary: reasoningParts.join(" "),
  };
}

export function registerTraverse(server: McpServer, graph: OntologyGraph): void {
  server.registerTool(
    "traverse",
    {
      description:
        "Traverse the design ontology from one or more starting nodes (typically intents, audience, or emotion nodes) to find all connected nodes in the target domain (typically visual_properties). Returns the reasoning paths and a summary. Use this to discover which visual properties apply to a given user intent or audience.",
      inputSchema: {
        from_nodes: z
          .array(z.string())
          .describe("Array of node IDs to start traversal from"),
        to_domain: z
          .string()
          .optional()
          .describe(
            'Target domain to traverse to (default: "visual_properties")'
          ),
        max_depth: z
          .number()
          .optional()
          .describe("Maximum traversal depth (default: 6)"),
      },
    },
    async ({ from_nodes, to_domain, max_depth }) => {
      const targetDomain = (to_domain ?? "visual_properties") as DomainName;
      const depth = max_depth ?? 6;

      const result = traverseToTarget(graph, from_nodes, targetDomain, depth);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
