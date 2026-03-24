import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OntologyGraph } from "../../core/graph.js";
import {
  searchNodes,
  checkAntiPatterns,
  getChainsForNode,
} from "../../core/graph.js";
import type { BaseNode, ReasoningChain, AntiPattern } from "../../core/types.js";

/**
 * Build a one-paragraph synthesis from matched nodes, chains, and anti-patterns.
 */
function buildGuidance(
  component: string,
  matchedNodes: BaseNode[],
  chains: ReasoningChain[],
  antiPatterns: AntiPattern[]
): string {
  const parts: string[] = [];

  parts.push(`When building the "${component}" component:`);

  // Collect key principles
  const principles = matchedNodes
    .map((n) => n.principle)
    .filter(Boolean)
    .slice(0, 3);
  if (principles.length > 0) {
    parts.push(`Key principles: ${principles.join("; ")}.`);
  }

  // Collect key implications
  const implications = matchedNodes
    .map((n) => n.implication)
    .filter(Boolean)
    .slice(0, 3);
  if (implications.length > 0) {
    parts.push(`Design implications: ${implications.join("; ")}.`);
  }

  // Collect specifications from visual property nodes
  const specs = matchedNodes
    .filter((n) => n.specification)
    .map((n) => `${n.label}: ${n.specification}`)
    .slice(0, 5);
  if (specs.length > 0) {
    parts.push(`Specifications: ${specs.join("; ")}.`);
  }

  // Anti-pattern warnings
  if (antiPatterns.length > 0) {
    const warnings = antiPatterns
      .map((ap) => `avoid "${ap.label}" (${ap.why_prohibited})`)
      .slice(0, 3);
    parts.push(`Anti-patterns to avoid: ${warnings.join("; ")}.`);
  }

  return parts.join(" ");
}

export function registerResolveForComponent(
  server: McpServer,
  graph: OntologyGraph
): void {
  server.registerTool(
    "resolve_for_component",
    {
      description:
        'The primary tool for UI generation. Describe the component you\'re building and optional context (user intent, audience, emotional state). Returns all relevant design reasoning, visual properties, anti-pattern warnings, and a synthesis of how to approach the component. Call this ONCE before generating any UI component.',
      inputSchema: {
        component: z
          .string()
          .describe(
            'What you\'re building (e.g., "risk score card", "loading state", "error message")'
          ),
        context: z
          .object({
            user_intent: z
              .string()
              .optional()
              .describe("Natural language description of the user's goal"),
            audience: z
              .string()
              .optional()
              .describe(
                'Which audience (e.g., "construction professional")'
              ),
            emotional_state: z
              .string()
              .optional()
              .describe(
                'Where the user is emotionally (e.g., "anxious", "focused")'
              ),
          })
          .optional()
          .describe("Optional context for more specific results"),
      },
    },
    async ({ component, context }) => {
      // 1. Semantic search for relevant nodes
      const componentMatches = searchNodes(graph, component);

      const contextMatches: BaseNode[] = [];
      if (context?.user_intent) {
        contextMatches.push(
          ...searchNodes(graph, context.user_intent, "intents")
        );
      }
      if (context?.audience) {
        contextMatches.push(
          ...searchNodes(graph, context.audience, "audience")
        );
      }
      if (context?.emotional_state) {
        contextMatches.push(
          ...searchNodes(graph, context.emotional_state, "emotions")
        );
      }

      // Deduplicate
      const allMatchedIds = new Set<string>();
      const allMatched: BaseNode[] = [];
      for (const node of [...componentMatches, ...contextMatches]) {
        const id = node.id as string;
        if (!allMatchedIds.has(id)) {
          allMatchedIds.add(id);
          allMatched.push(node);
        }
      }

      // 2. Find visual properties via traversal from matched nodes
      const startIds = allMatched
        .map((n) => n.id as string)
        .filter(
          (id) =>
            graph.domainIndex.get(id) !== "visual_properties" &&
            graph.domainIndex.get(id) !== "accessibility"
        );

      // BFS to visual properties
      const visualProps = new Map<string, BaseNode>();

      for (const startId of startIds) {
        const queue: string[] = [startId];
        const localVisited = new Set<string>([startId]);

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          if (graph.domainIndex.get(currentId) === "visual_properties") {
            const node = graph.nodeIndex.get(currentId);
            if (node) visualProps.set(currentId, node);
            continue;
          }
          for (const nextId of graph.outgoing.get(currentId) ?? []) {
            if (!localVisited.has(nextId)) {
              localVisited.add(nextId);
              queue.push(nextId);
            }
          }
        }
      }

      // Also include directly matched visual property nodes
      for (const node of allMatched) {
        const id = node.id as string;
        if (graph.domainIndex.get(id) === "visual_properties") {
          visualProps.set(id, node);
        }
      }

      // 3. Collect relevant chains
      const relevantChains = new Map<string, ReasoningChain>();
      for (const id of allMatchedIds) {
        for (const chain of getChainsForNode(graph, id)) {
          relevantChains.set(chain.id, chain);
        }
      }

      // 4. Check anti-patterns
      const antiPatternMatches = checkAntiPatterns(graph, component);

      // 5. Build reasoning summary
      const reasoningParts = allMatched
        .map((n) => n.reasoning)
        .filter(Boolean) as string[];
      const reasoningSummary = reasoningParts.join(" ");

      // 6. Build generation guidance
      const guidance = buildGuidance(
        component,
        [...allMatched, ...visualProps.values()],
        Array.from(relevantChains.values()),
        antiPatternMatches
      );

      const result = {
        relevant_chains: Array.from(relevantChains.values()),
        visual_properties: Array.from(visualProps.values()),
        anti_pattern_warnings: antiPatternMatches,
        reasoning_summary: reasoningSummary,
        generation_guidance: guidance,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
