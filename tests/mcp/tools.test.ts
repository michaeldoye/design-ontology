import { describe, it, expect, beforeAll } from "vitest";
import { buildGraph, type OntologyGraph } from "../../src/core/graph.js";
import { getNode, getConnections, getChainsForNode } from "../../src/core/graph.js";
import { searchNodes, checkAntiPatterns } from "../../src/core/graph.js";
import { RICH_ONTOLOGY } from "../fixtures.js";
import type { DomainName } from "../../src/core/types.js";

/**
 * These tests exercise the same logic the MCP tools use, without needing
 * to spin up the full MCP server. The tools are thin wrappers around
 * core graph functions, so testing the logic directly is equivalent.
 */

let graph: OntologyGraph;

beforeAll(() => {
  graph = buildGraph(RICH_ONTOLOGY);
});

describe("get_node tool logic", () => {
  it("returns node with domain, connections, and chains", () => {
    const node = getNode(graph, "INT-001");
    expect(node).not.toBeNull();

    const domain = graph.domainIndex.get("INT-001");
    expect(domain).toBe("intents");

    const incoming = getConnections(graph, "INT-001", "in");
    const outgoing = getConnections(graph, "INT-001", "out");
    const chains = getChainsForNode(graph, "INT-001");

    expect(outgoing.length).toBeGreaterThan(0);
    expect(chains.length).toBe(3);
  });

  it("returns null for unknown node", () => {
    expect(getNode(graph, "FAKE-999")).toBeNull();
  });
});

describe("get_chain tool logic", () => {
  it("finds chain by ID", () => {
    const chain = RICH_ONTOLOGY.edges.reasoning_chains.find(
      (c) => c.id === "CHAIN-001"
    );
    expect(chain).toBeDefined();
    expect(chain!.name).toBe("Risk to Layout");
  });

  it("finds chain by partial name match", () => {
    const lower = "colors";
    const chain = RICH_ONTOLOGY.edges.reasoning_chains.find((c) =>
      c.name.toLowerCase().includes(lower)
    );
    expect(chain).toBeDefined();
    expect(chain!.id).toBe("CHAIN-002");
  });

  it("expands all path nodes", () => {
    const chain = RICH_ONTOLOGY.edges.reasoning_chains[0];
    const expanded = chain.path.map((id) => getNode(graph, id as string));
    expect(expanded.every((n) => n !== null)).toBe(true);
  });

  it("returns undefined for non-existent chain", () => {
    const chain = RICH_ONTOLOGY.edges.reasoning_chains.find(
      (c) => c.id === "CHAIN-999"
    );
    expect(chain).toBeUndefined();
  });
});

describe("traverse tool logic", () => {
  it("traverses from intent to visual_properties", () => {
    // BFS from INT-001 to visual_properties
    const startIds = ["INT-001"];
    const targetDomain: DomainName = "visual_properties";
    const paths: string[][] = [];
    const reached = new Map<string, object>();

    for (const startId of startIds) {
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
          if (node) reached.set(currentId, node);
          continue;
        }
        if (currentPath.length >= 6) continue;
        for (const nextId of graph.outgoing.get(currentId) ?? []) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push([nextId, [...currentPath, nextId]]);
          }
        }
      }
    }

    expect(paths.length).toBeGreaterThan(0);
    expect(reached.size).toBeGreaterThan(0);
  });

  it("traverses to accessibility domain", () => {
    const targetDomain: DomainName = "accessibility";
    const startIds = ["VIS-001"];
    const reached = new Set<string>();

    const queue: string[] = [startIds[0]];
    const visited = new Set<string>(startIds);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (graph.domainIndex.get(currentId) === targetDomain) {
        reached.add(currentId);
        continue;
      }
      for (const nextId of graph.outgoing.get(currentId) ?? []) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push(nextId);
        }
      }
    }

    expect(reached.has("A11Y-001")).toBe(true);
  });
});

describe("check_anti_patterns tool logic", () => {
  it("returns matches with full details", () => {
    const matches = checkAntiPatterns(graph, "generic dashboard large cards");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toHaveProperty("label");
    expect(matches[0]).toHaveProperty("description");
    expect(matches[0]).toHaveProperty("why_prohibited");
    expect(matches[0]).toHaveProperty("traces_to");
  });

  it("returns empty array with no matches", () => {
    const matches = checkAntiPatterns(graph, "implementing sorting algorithm");
    expect(matches).toEqual([]);
  });
});

describe("resolve_for_component tool logic", () => {
  it("finds relevant nodes for a component description", () => {
    const componentMatches = searchNodes(graph, "risk assessment");
    expect(componentMatches.length).toBeGreaterThan(0);
  });

  it("finds intent nodes for user_intent context", () => {
    const intentMatches = searchNodes(graph, "environmental risk", "intents");
    expect(intentMatches.length).toBeGreaterThan(0);
  });

  it("finds audience nodes for audience context", () => {
    const audMatches = searchNodes(graph, "construction", "audience");
    expect(audMatches.length).toBeGreaterThan(0);
    expect(audMatches[0].id).toBe("AUD-001");
  });

  it("combines search + traversal + anti-pattern check", () => {
    // Simulate resolve_for_component
    const componentMatches = searchNodes(graph, "risk score card");
    const intentMatches = searchNodes(graph, "risk assessment", "intents");

    const allMatched = [...componentMatches, ...intentMatches];
    const startIds = allMatched
      .map((n) => n.id as string)
      .filter(
        (id) =>
          graph.domainIndex.get(id) !== "visual_properties" &&
          graph.domainIndex.get(id) !== "accessibility"
      );

    // BFS to visual properties
    const visualProps = new Set<string>();
    for (const startId of startIds) {
      const queue: string[] = [startId];
      const visited = new Set<string>([startId]);
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (graph.domainIndex.get(currentId) === "visual_properties") {
          visualProps.add(currentId);
          continue;
        }
        for (const nextId of graph.outgoing.get(currentId) ?? []) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push(nextId);
          }
        }
      }
    }

    expect(visualProps.size).toBeGreaterThan(0);

    // Check anti-patterns
    const antiPatterns = checkAntiPatterns(graph, "risk score card");
    // May or may not match — just shouldn't throw
    expect(Array.isArray(antiPatterns)).toBe(true);
  });
});

describe("search tool logic", () => {
  it("returns nodes with domain annotation", () => {
    const results = searchNodes(graph, "layout");
    expect(results.length).toBeGreaterThan(0);

    for (const node of results) {
      const domain = graph.domainIndex.get(node.id as string);
      expect(domain).toBeDefined();
    }
  });

  it("respects domain filter", () => {
    const results = searchNodes(graph, "risk", "visual_properties");
    for (const node of results) {
      expect(graph.domainIndex.get(node.id as string)).toBe(
        "visual_properties"
      );
    }
  });
});
