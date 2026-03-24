import { describe, it, expect, beforeAll } from "vitest";
import {
  buildGraph,
  getNode,
  getConnections,
  getChainsForNode,
  traverseIntentToVisual,
  resolveVisualProperties,
  checkAntiPatterns,
  searchNodes,
  type OntologyGraph,
} from "../../src/core/graph.js";
import { MINIMAL_ONTOLOGY, RICH_ONTOLOGY } from "../fixtures.js";

describe("buildGraph", () => {
  it("indexes all nodes", () => {
    const graph = buildGraph(RICH_ONTOLOGY);
    // 2 intents + 2 psychology + 1 culture + 1 emotion + 1 audience + 3 visual + 1 a11y = 11
    expect(graph.nodeIndex.size).toBe(11);
  });

  it("builds outgoing adjacency from connects_to", () => {
    const graph = buildGraph(MINIMAL_ONTOLOGY);
    const out = graph.outgoing.get("INT-001");
    expect(out).toBeDefined();
    expect(out!.has("PSY-001")).toBe(true);
  });

  it("builds incoming adjacency", () => {
    const graph = buildGraph(MINIMAL_ONTOLOGY);
    const incoming = graph.incoming.get("PSY-001");
    expect(incoming).toBeDefined();
    expect(incoming!.has("INT-001")).toBe(true);
  });

  it("indexes chains by node", () => {
    const graph = buildGraph(MINIMAL_ONTOLOGY);
    const chains = graph.chainIndex.get("PSY-001");
    expect(chains).toHaveLength(1);
    expect(chains![0].name).toBe("Task to Layout");
  });
});

describe("getNode", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("returns node by ID", () => {
    const node = getNode(graph, "INT-001");
    expect(node).toBeDefined();
    expect(node!.label).toBe("Risk Assessment");
  });

  it("returns null for missing node", () => {
    expect(getNode(graph, "FAKE-999")).toBeNull();
  });
});

describe("getConnections", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("returns outgoing connections", () => {
    const out = getConnections(graph, "INT-001", "out");
    const ids = out.map((n) => n.id);
    expect(ids).toContain("PSY-001");
    expect(ids).toContain("PSY-002");
    expect(ids).toContain("EMO-001");
    expect(ids).toContain("CUL-001");
  });

  it("returns incoming connections", () => {
    const incoming = getConnections(graph, "PSY-001", "in");
    const ids = incoming.map((n) => n.id);
    expect(ids).toContain("INT-001");
    expect(ids).toContain("INT-002");
  });

  it("returns both directions", () => {
    const both = getConnections(graph, "PSY-001", "both");
    const ids = both.map((n) => n.id);
    expect(ids).toContain("INT-001"); // incoming
    expect(ids).toContain("VIS-001"); // outgoing
  });

  it("returns empty for unknown node", () => {
    expect(getConnections(graph, "FAKE-999", "out")).toEqual([]);
  });
});

describe("getChainsForNode", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("returns chains for a node in multiple chains", () => {
    const chains = getChainsForNode(graph, "INT-001");
    expect(chains.length).toBe(3); // All 3 chains start with INT-001
  });

  it("returns empty for node in no chains", () => {
    const chains = getChainsForNode(graph, "AUD-001");
    expect(chains).toEqual([]);
  });
});

describe("traverseIntentToVisual", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("finds paths from intent to visual properties", () => {
    const result = traverseIntentToVisual(graph, "INT-001");
    expect(result.paths.length).toBeGreaterThan(0);
    expect(result.visual_properties.length).toBeGreaterThan(0);
  });

  it("each path starts with the intent", () => {
    const result = traverseIntentToVisual(graph, "INT-001");
    for (const path of result.paths) {
      expect(path[0]).toBe("INT-001");
    }
  });

  it("each path ends at a visual property node", () => {
    const result = traverseIntentToVisual(graph, "INT-001");
    for (const path of result.paths) {
      const lastId = path[path.length - 1];
      expect(lastId.startsWith("VIS-")).toBe(true);
    }
  });

  it("returns empty for non-existent node", () => {
    const result = traverseIntentToVisual(graph, "FAKE-999");
    expect(result.paths).toEqual([]);
    expect(result.visual_properties).toEqual([]);
  });

  it("handles node with no outgoing connections", () => {
    const result = traverseIntentToVisual(graph, "A11Y-001");
    expect(result.paths).toEqual([]);
  });
});

describe("resolveVisualProperties", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("resolves from intent IDs", () => {
    const props = resolveVisualProperties(graph, {
      intentIds: ["INT-001"],
    });
    expect(props.length).toBeGreaterThan(0);
    const ids = props.map((p) => p.id);
    expect(ids).toContain("VIS-001");
  });

  it("resolves from audience IDs", () => {
    const props = resolveVisualProperties(graph, {
      audienceIds: ["AUD-001"],
    });
    expect(props.length).toBeGreaterThan(0);
  });

  it("resolves from multiple sources", () => {
    const props = resolveVisualProperties(graph, {
      intentIds: ["INT-001"],
      emotionIds: ["EMO-001"],
    });
    expect(props.length).toBeGreaterThan(0);
  });

  it("returns empty for empty context", () => {
    expect(resolveVisualProperties(graph, {})).toEqual([]);
  });
});

describe("checkAntiPatterns", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("matches description against anti-patterns", () => {
    const matches = checkAntiPatterns(
      graph,
      "generic dashboard with large cards"
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].label).toBe("Generic Dashboard");
  });

  it("matches softened language anti-pattern", () => {
    const matches = checkAntiPatterns(
      graph,
      "using hedging language for risk"
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it("returns empty for unrelated description", () => {
    const matches = checkAntiPatterns(
      graph,
      "implementing a quantum computing algorithm"
    );
    expect(matches).toEqual([]);
  });

  it("handles ontology without anti_patterns", () => {
    const data = structuredClone(RICH_ONTOLOGY);
    delete (data as any).anti_patterns;
    const g = buildGraph(data);
    expect(checkAntiPatterns(g, "generic dashboard")).toEqual([]);
  });
});

describe("searchNodes", () => {
  let graph: OntologyGraph;
  beforeAll(() => {
    graph = buildGraph(RICH_ONTOLOGY);
  });

  it("finds nodes by keyword", () => {
    const results = searchNodes(graph, "cognitive");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("PSY-001");
  });

  it("finds nodes by domain filter", () => {
    const results = searchNodes(graph, "risk", "intents");
    const ids = results.map((n) => n.id);
    expect(ids.every((id: string) => id.startsWith("INT-"))).toBe(true);
  });

  it("returns max 10 results", () => {
    const results = searchNodes(graph, "a");
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("returns empty for no match", () => {
    expect(searchNodes(graph, "xyzzyplugh")).toEqual([]);
  });
});

describe("circular reference safety", () => {
  it("does not infinite loop on circular connects_to", () => {
    const circular = structuredClone(MINIMAL_ONTOLOGY);
    // Create a cycle: VIS-001 -> PSY-001 (PSY-001 already -> VIS-001)
    circular.nodes.visual_properties["VIS-001"].connects_to = [
      "PSY-001" as const,
    ];
    const graph = buildGraph(circular);
    // Should terminate
    const result = traverseIntentToVisual(graph, "INT-001");
    expect(result).toBeDefined();
  });
});
