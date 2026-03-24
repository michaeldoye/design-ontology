import { readFileSync } from "node:fs";
import { validateOntology } from "../core/validator.js";
import { buildGraph, type OntologyGraph } from "../core/graph.js";
import type { DesignOntology } from "../core/types.js";

/**
 * Load an ontology file, validate it, and build the in-memory graph.
 * Writes diagnostics to stderr. Throws on invalid ontology.
 */
export function loadOntology(filePath: string): {
  ontology: DesignOntology;
  graph: OntologyGraph;
} {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Cannot read ontology file: ${filePath}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Ontology file is not valid JSON: ${filePath}`);
  }

  const result = validateOntology(data);
  const errors = result.errors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    const msg = errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Ontology validation failed:\n${msg}`);
  }

  const ontology = data as DesignOntology;
  const graph = buildGraph(ontology);

  return { ontology, graph };
}
