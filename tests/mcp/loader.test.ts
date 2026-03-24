import { describe, it, expect } from "vitest";
import { loadOntology } from "../../src/mcp/loader.js";

describe("loadOntology", () => {
  it("loads and validates the EcoVoorscan example", () => {
    const { ontology, graph } = loadOntology(
      "examples/ecovoorscan/design-ontology.json"
    );
    expect(ontology.meta.product).toBe("EcoVoorscan");
    expect(graph.nodeIndex.size).toBeGreaterThan(0);
  });

  it("throws for non-existent file", () => {
    expect(() => loadOntology("/tmp/nonexistent.json")).toThrow(
      "Cannot read ontology file"
    );
  });

  it("throws for invalid JSON", () => {
    const { writeFileSync } = require("node:fs");
    writeFileSync("/tmp/bad.json", "not json");
    expect(() => loadOntology("/tmp/bad.json")).toThrow("not valid JSON");
  });

  it("throws for schema-invalid ontology", () => {
    const { writeFileSync } = require("node:fs");
    writeFileSync("/tmp/invalid-ontology.json", JSON.stringify({ bad: true }));
    expect(() => loadOntology("/tmp/invalid-ontology.json")).toThrow(
      "validation failed"
    );
  });
});
