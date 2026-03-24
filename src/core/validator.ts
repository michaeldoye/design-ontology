import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { DesignOntology, DomainName } from "./types.js";

const require = createRequire(import.meta.url);

const Ajv = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats");

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSchema(): object {
  // In the built package, schema is at ../../schema/ relative to dist/core/
  // In dev, it's at ../../schema/ relative to src/core/
  const candidates = [
    join(__dirname, "..", "..", "schema", "design-ontology.schema.json"),
    join(__dirname, "..", "schema", "design-ontology.schema.json"),
  ];
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, "utf-8"));
    } catch {
      // try next
    }
  }
  throw new Error(
    "Could not find design-ontology.schema.json. Looked in: " +
      candidates.join(", ")
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOMAIN_NAMES: DomainName[] = [
  "intents",
  "psychology",
  "culture",
  "emotions",
  "audience",
  "visual_properties",
  "accessibility",
];

/**
 * Collect every node ID across all domain groups and return a map from
 * nodeId → domain name, plus a set of all IDs for fast lookup.
 */
function collectNodeIds(
  nodes: DesignOntology["nodes"]
): { idToDomain: Map<string, DomainName>; allIds: Set<string> } {
  const idToDomain = new Map<string, DomainName>();
  for (const domain of DOMAIN_NAMES) {
    const group = nodes[domain];
    if (!group) continue;
    for (const id of Object.keys(group)) {
      idToDomain.set(id, domain);
    }
  }
  return { idToDomain, allIds: new Set(idToDomain.keys()) };
}

// ---------------------------------------------------------------------------
// JSON Schema validation
// ---------------------------------------------------------------------------

function runSchemaValidation(data: unknown): ValidationError[] {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (validate.errors ?? []).map((err: any) => ({
    path: err.instancePath || "/",
    message: err.message ?? "Unknown schema error",
    severity: "error" as const,
  }));
}

// ---------------------------------------------------------------------------
// Referential integrity checks
// ---------------------------------------------------------------------------

function checkReferentialIntegrity(
  ontology: DesignOntology
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { allIds } = collectNodeIds(ontology.nodes);

  function assertRefsExist(
    refs: readonly string[] | undefined,
    path: string,
    fieldName: string
  ) {
    if (!refs) return;
    for (const ref of refs) {
      if (!allIds.has(ref)) {
        errors.push({
          path: `${path}/${fieldName}`,
          message: `Referenced node "${ref}" does not exist in any domain group`,
          severity: "error",
        });
      }
    }
  }

  // Check nodes: connects_to, derived_from
  for (const domain of DOMAIN_NAMES) {
    const group = ontology.nodes[domain];
    if (!group) continue;
    for (const [id, node] of Object.entries(group)) {
      const basePath = `/nodes/${domain}/${id}`;
      assertRefsExist(
        node.connects_to as string[],
        basePath,
        "connects_to"
      );
      assertRefsExist(
        node.derived_from as string[] | undefined,
        basePath,
        "derived_from"
      );
    }
  }

  // Check reasoning chain paths
  for (let i = 0; i < ontology.edges.reasoning_chains.length; i++) {
    const chain = ontology.edges.reasoning_chains[i];
    assertRefsExist(
      chain.path as string[],
      `/edges/reasoning_chains/${i}`,
      "path"
    );
  }

  // Check anti-pattern traces_to
  if (ontology.anti_patterns) {
    for (const [id, ap] of Object.entries(ontology.anti_patterns)) {
      assertRefsExist(
        ap.traces_to as string[],
        `/anti_patterns/${id}`,
        "traces_to"
      );
    }
  }

  // Check for duplicate IDs across domain groups
  const seen = new Map<string, DomainName>();
  for (const domain of DOMAIN_NAMES) {
    const group = ontology.nodes[domain];
    if (!group) continue;
    for (const id of Object.keys(group)) {
      const existing = seen.get(id);
      if (existing) {
        errors.push({
          path: `/nodes/${domain}/${id}`,
          message: `Duplicate node ID "${id}" — also exists in "${existing}"`,
          severity: "error",
        });
      } else {
        seen.set(id, domain);
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Completeness warnings
// ---------------------------------------------------------------------------

function checkCompleteness(ontology: DesignOntology): ValidationError[] {
  const warnings: ValidationError[] = [];
  const { allIds } = collectNodeIds(ontology.nodes);

  // Collect all referenced node IDs (from connects_to, chains, anti-patterns)
  const referenced = new Set<string>();

  for (const domain of DOMAIN_NAMES) {
    const group = ontology.nodes[domain];
    if (!group) continue;
    for (const node of Object.values(group)) {
      for (const ref of node.connects_to) {
        referenced.add(ref);
      }
      if (node.derived_from) {
        for (const ref of node.derived_from) {
          referenced.add(ref);
        }
      }
    }
  }

  for (const chain of ontology.edges.reasoning_chains) {
    for (const ref of chain.path) {
      referenced.add(ref);
    }
  }

  if (ontology.anti_patterns) {
    for (const ap of Object.values(ontology.anti_patterns)) {
      for (const ref of ap.traces_to) {
        referenced.add(ref);
      }
    }
  }

  // Orphan nodes: not referenced by any edge, chain, or anti-pattern
  for (const id of allIds) {
    if (!referenced.has(id)) {
      warnings.push({
        path: `/nodes/*/${id}`,
        message: `Orphan node "${id}" is not referenced by any connection, chain, or anti-pattern`,
        severity: "warning",
      });
    }
  }

  // Domains with zero nodes
  for (const domain of DOMAIN_NAMES) {
    const group = ontology.nodes[domain];
    if (!group || Object.keys(group).length === 0) {
      warnings.push({
        path: `/nodes/${domain}`,
        message: `Domain "${domain}" has zero nodes`,
        severity: "warning",
      });
    }
  }

  // Visual property nodes not referenced by any reasoning chain
  const chainReferencedVis = new Set<string>();
  for (const chain of ontology.edges.reasoning_chains) {
    for (const ref of chain.path) {
      if (ref.startsWith("VIS-")) {
        chainReferencedVis.add(ref);
      }
    }
  }
  const visGroup = ontology.nodes.visual_properties;
  if (visGroup) {
    for (const id of Object.keys(visGroup)) {
      if (!chainReferencedVis.has(id)) {
        warnings.push({
          path: `/nodes/visual_properties/${id}`,
          message: `Visual property node "${id}" is not referenced by any reasoning chain`,
          severity: "warning",
        });
      }
    }
  }

  // Anti-patterns that don't trace to any visual property node
  if (ontology.anti_patterns) {
    for (const [id, ap] of Object.entries(ontology.anti_patterns)) {
      const hasVisProp = ap.traces_to.some((ref: string) =>
        ref.startsWith("VIS-")
      );
      if (!hasVisProp) {
        warnings.push({
          path: `/anti_patterns/${id}`,
          message: `Anti-pattern "${id}" does not trace to any visual property node`,
          severity: "warning",
        });
      }
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a design ontology against the JSON Schema and run referential
 * integrity checks and completeness warnings.
 *
 * Returns `{ valid, errors }` where `valid` is true only when there are
 * zero errors (warnings do not affect validity).
 */
export function validateOntology(data: unknown): ValidationResult {
  // Step 1: JSON Schema validation
  const schemaErrors = runSchemaValidation(data);

  // If schema validation fails, we can't safely run deeper checks
  if (schemaErrors.length > 0) {
    return { valid: false, errors: schemaErrors };
  }

  const ontology = data as DesignOntology;

  // Step 2: Referential integrity
  const refErrors = checkReferentialIntegrity(ontology);

  // Step 3: Completeness warnings
  const completenessWarnings = checkCompleteness(ontology);

  const allErrors = [...refErrors, ...completenessWarnings];
  const hasErrors = allErrors.some((e) => e.severity === "error");

  return {
    valid: !hasErrors,
    errors: allErrors,
  };
}
