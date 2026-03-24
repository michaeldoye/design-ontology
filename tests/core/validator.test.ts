import { describe, it, expect } from "vitest";
import { validateOntology } from "../../src/core/validator.js";
import { MINIMAL_ONTOLOGY, RICH_ONTOLOGY } from "../fixtures.js";

describe("validateOntology", () => {
  // --- Valid ontologies ---

  it("accepts a minimal valid ontology", () => {
    const result = validateOntology(MINIMAL_ONTOLOGY);
    expect(result.valid).toBe(true);
    expect(result.errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("accepts a rich valid ontology", () => {
    const result = validateOntology(RICH_ONTOLOGY);
    expect(result.valid).toBe(true);
  });

  it("accepts the EcoVoorscan example ontology", async () => {
    const { readFileSync } = await import("node:fs");
    const data = JSON.parse(
      readFileSync("examples/ecovoorscan/design-ontology.json", "utf-8")
    );
    const result = validateOntology(data);
    expect(result.valid).toBe(true);
  });

  // --- Schema validation errors ---

  it("rejects non-object input", () => {
    const result = validateOntology("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects missing meta", () => {
    const data = { ...MINIMAL_ONTOLOGY, meta: undefined };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects missing nodes", () => {
    const data = { ...MINIMAL_ONTOLOGY, nodes: undefined };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects missing edges", () => {
    const data = { ...MINIMAL_ONTOLOGY, edges: undefined };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid version format", () => {
    const data = {
      ...MINIMAL_ONTOLOGY,
      meta: { ...MINIMAL_ONTOLOGY.meta, version: "v1" },
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid node ID format", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    (data.nodes.intents as Record<string, unknown>)["bad-id"] = {
      id: "bad-id",
      label: "Bad",
      description: "Bad ID format.",
      connects_to: [],
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects missing required node fields", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    (data.nodes.intents as Record<string, unknown>)["INT-099"] = {
      id: "INT-099",
      // missing label, description, connects_to
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects chain with fewer than 3 path nodes", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.edges.reasoning_chains = [
      {
        id: "CHAIN-001" as const,
        name: "Short",
        path: ["INT-001" as const, "VIS-001" as const],
        description: "Too short.",
        weight: 3,
      },
    ];
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects chain weight outside 1-5", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.edges.reasoning_chains[0] = {
      ...data.edges.reasoning_chains[0],
      weight: 10,
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid chain ID format", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.edges.reasoning_chains[0] = {
      ...data.edges.reasoning_chains[0],
      id: "BADCHAIN" as any,
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects anti-pattern with invalid ID key", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    (data.anti_patterns as Record<string, unknown>)!["BAD-FORMAT"] = {
      label: "Bad",
      description: "Bad.",
      why_prohibited: "Bad.",
      traces_to: ["INT-001"],
    };
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("rejects description exceeding 500 characters", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.nodes.intents["INT-001"].description = "x".repeat(501);
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  // --- Referential integrity errors ---

  it("detects broken connects_to references", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.nodes.intents["INT-001"].connects_to = ["PSY-999" as const];
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("PSY-999"),
      })
    );
  });

  it("detects broken chain path references", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.edges.reasoning_chains[0].path = [
      "INT-001" as const,
      "PSY-001" as const,
      "VIS-999" as const,
    ];
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("VIS-999"),
      })
    );
  });

  it("detects broken anti-pattern traces_to references", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.anti_patterns!["ANTI-001"].traces_to = ["FAKE-001" as const];
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  it("detects broken derived_from references", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.nodes.psychology["PSY-001"].derived_from = ["FAKE-001" as const];
    const result = validateOntology(data);
    expect(result.valid).toBe(false);
  });

  // --- Completeness warnings ---

  it("warns about empty domains", () => {
    const result = validateOntology(MINIMAL_ONTOLOGY);
    const warnings = result.errors.filter((e) => e.severity === "warning");
    const emptyDomainWarnings = warnings.filter((w) =>
      w.message.includes("has zero nodes")
    );
    expect(emptyDomainWarnings.length).toBeGreaterThan(0);
  });

  it("warns about orphan nodes", () => {
    const data = structuredClone(MINIMAL_ONTOLOGY);
    data.nodes.psychology["PSY-099"] = {
      id: "PSY-099" as const,
      label: "Orphan",
      description: "Not referenced anywhere.",
      connects_to: [],
    };
    const result = validateOntology(data);
    const orphanWarnings = result.errors.filter(
      (e) => e.severity === "warning" && e.message.includes("Orphan")
    );
    expect(orphanWarnings.length).toBeGreaterThan(0);
  });

  it("warnings do not block validity", () => {
    const result = validateOntology(MINIMAL_ONTOLOGY);
    const warnings = result.errors.filter((e) => e.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(result.valid).toBe(true);
  });
});
