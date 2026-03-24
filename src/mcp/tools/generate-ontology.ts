import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { writeFileSync } from "node:fs";
import { validateOntology } from "../../core/validator.js";
import { buildGraph, type OntologyGraph } from "../../core/graph.js";
import type { DesignOntology } from "../../core/types.js";

const ONTOLOGY_SCHEMA_INSTRUCTIONS = `Generate a design ontology JSON object from the product spec provided. The ontology is a knowledge graph encoding WHY behind design decisions.

## Structure

{
  "meta": {
    "product": "Product Name",
    "version": "1.0.0",
    "generated": "<ISO 8601 date>",
    "purpose": "What this ontology encodes",
    "schema_version": "1.0.0"
  },
  "nodes": {
    "intents": { "INT-001": { ... } },
    "psychology": { "PSY-001": { ... } },
    "culture": { "CUL-001": { ... } },
    "emotions": { "EMO-001": { ... } },
    "audience": { "AUD-001": { ... } },
    "visual_properties": { "VIS-001": { ... } },
    "accessibility": { "A11Y-001": { ... } }
  },
  "edges": {
    "reasoning_chains": [
      { "id": "CHAIN-001", "name": "...", "path": ["INT-001", "PSY-001", "VIS-001"], "description": "...", "weight": 5 }
    ]
  },
  "anti_patterns": {
    "ANTI-001": { "label": "...", "description": "...", "why_prohibited": "...", "traces_to": ["INT-001"] }
  }
}

## Node format

Every node requires: "id" (matching its key), "label", "description" (max 500 chars), "connects_to" (array of node IDs).
Optional: "short" (max 50), "principle", "implication", "anti_pattern", "specification" (CSS-like), "property_type", "derived_from", "reasoning", "rule", "phase", "state", "ui_response", "role", "expertise", "constraints" (array), "linguistic_examples" (array).

## Rules

- IDs: INT-xxx, PSY-xxx, CUL-xxx, EMO-xxx, AUD-xxx, VIS-xxx, A11Y-xxx, CHAIN-xxx, ANTI-xxx
- Chain paths: minimum 3 nodes, weight 1-5
- Every connects_to/path/traces_to/derived_from ID must reference an existing node
- Be specific, not generic. "Dutch construction professionals need data density" beats "users need clear UI"
- Visual properties should include concrete CSS specs where possible
- Always include accessibility nodes
- Aim for 4-8 intents, 4-8 psychology, 3-6 culture, 3-6 emotions, 2-5 audience, 8-15 visual properties, 3-6 accessibility, 5-12 chains, 3-8 anti-patterns`;

export function registerGenerateOntology(
  server: McpServer,
  state: { graph: OntologyGraph | null; ontologyPath: string }
): void {
  server.registerTool(
    "generate_ontology",
    {
      description:
        "Generate a design ontology from a product spec. Returns instructions for the ontology schema — you (the AI agent) generate the JSON, then call save_ontology to validate and save it. No external API key required.",
      inputSchema: {
        product_spec: z
          .string()
          .describe(
            "The product specification text. Include: target audience, core user flows, brand/tone, cultural context, accessibility needs, and what the product is NOT."
          ),
      },
    },
    async ({ product_spec }) => {
      return {
        content: [
          {
            type: "text" as const,
            text:
              ONTOLOGY_SCHEMA_INSTRUCTIONS +
              "\n\n## Product Spec\n\n" +
              product_spec +
              "\n\nGenerate the complete ontology JSON now. Then call the save_ontology tool with the JSON to validate and save it.",
          },
        ],
      };
    }
  );

  server.registerTool(
    "save_ontology",
    {
      description:
        "Validate and save a generated design ontology to disk. Call this after generating ontology JSON with generate_ontology. Validates against the schema, reports any errors, and writes the file.",
      inputSchema: {
        ontology_json: z
          .string()
          .describe("The complete ontology JSON string to validate and save"),
        output_path: z
          .string()
          .optional()
          .describe(
            "File path to save to (default: ./design-ontology.json)"
          ),
      },
    },
    async ({ ontology_json, output_path }) => {
      const savePath = output_path ?? "./design-ontology.json";

      let data: unknown;
      try {
        data = JSON.parse(ontology_json);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: "Invalid JSON. Please fix the JSON syntax and try again.",
              }),
            },
          ],
        };
      }

      const result = validateOntology(data);
      const errors = result.errors.filter((e) => e.severity === "error");
      const warnings = result.errors.filter((e) => e.severity === "warning");

      if (errors.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: `Validation failed with ${errors.length} error(s). Fix these and call save_ontology again.`,
                  errors: errors.map((e) => ({
                    path: e.path,
                    message: e.message,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Write the file
      try {
        writeFileSync(savePath, JSON.stringify(data, null, 2) + "\n");
      } catch (e) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Failed to write file: ${(e as Error).message}`,
              }),
            },
          ],
        };
      }

      // Rebuild the graph so query tools work immediately
      const ontology = data as DesignOntology;
      state.graph = buildGraph(ontology);

      // Count nodes
      const domains = [
        "intents",
        "psychology",
        "culture",
        "emotions",
        "audience",
        "visual_properties",
        "accessibility",
      ] as const;
      const nodeCount = domains.reduce(
        (sum, d) => sum + Object.keys(ontology.nodes[d] ?? {}).length,
        0
      );
      const chainCount = ontology.edges.reasoning_chains.length;
      const antiCount = Object.keys(ontology.anti_patterns ?? {}).length;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                saved_to: savePath,
                summary: {
                  nodes: nodeCount,
                  chains: chainCount,
                  anti_patterns: antiCount,
                },
                warnings:
                  warnings.length > 0
                    ? warnings.map((w) => ({
                        path: w.path,
                        message: w.message,
                      }))
                    : undefined,
                message: `Ontology saved. ${nodeCount} nodes, ${chainCount} chains, ${antiCount} anti-patterns. The query tools (get_node, traverse, resolve_for_component, etc.) are now active.`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
