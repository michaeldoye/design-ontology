import type {
  DesignOntology,
  BaseNode,
  ReasoningChain,
  AntiPattern,
  VisualPropertyNode,
  DomainName,
} from "./types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single path found during traversal, with the reasoning collected along the way. */
export interface TraversalPath {
  nodeIds: string[];
}

/** Result of a graph traversal from source nodes toward a target domain. */
export interface TraversalResult {
  /** Every distinct path found from a source node to a target domain node. */
  paths: string[][];
  /** Deduplicated target-domain nodes reached by the traversal. */
  visual_properties: VisualPropertyNode[];
  /** Concatenated reasoning text from all traversed nodes. */
  reasoning_summary: string;
}

/** The indexed, in-memory representation of the ontology graph. */
export interface OntologyGraph {
  /** The raw ontology data. */
  ontology: DesignOntology;
  /** nodeId → node object (across all domains). */
  nodeIndex: Map<string, BaseNode>;
  /** nodeId → domain name. */
  domainIndex: Map<string, DomainName>;
  /** Forward adjacency: nodeId → set of node IDs it connects to. */
  outgoing: Map<string, Set<string>>;
  /** Reverse adjacency: nodeId → set of node IDs that connect to it. */
  incoming: Map<string, Set<string>>;
  /** nodeId → chains that include this node. */
  chainIndex: Map<string, ReasoningChain[]>;
}

// ---------------------------------------------------------------------------
// Constants
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

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

/**
 * Build an indexed in-memory graph from a validated ontology.
 * This is the entry point — all query functions operate on the returned graph.
 */
export function buildGraph(ontology: DesignOntology): OntologyGraph {
  const nodeIndex = new Map<string, BaseNode>();
  const domainIndex = new Map<string, DomainName>();
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  const chainIndex = new Map<string, ReasoningChain[]>();

  // Index all nodes
  for (const domain of DOMAIN_NAMES) {
    const group = ontology.nodes[domain];
    if (!group) continue;
    for (const [id, node] of Object.entries(group)) {
      nodeIndex.set(id, node);
      domainIndex.set(id, domain);
      outgoing.set(id, new Set<string>());
      incoming.set(id, new Set<string>());
    }
  }

  // Build adjacency from connects_to
  for (const [id, node] of nodeIndex) {
    for (const target of node.connects_to) {
      const targetStr = target as string;
      outgoing.get(id)!.add(targetStr);
      if (!incoming.has(targetStr)) {
        incoming.set(targetStr, new Set<string>());
      }
      incoming.get(targetStr)!.add(id);
    }
  }

  // Build adjacency from reasoning chain paths (sequential edges)
  for (const chain of ontology.edges.reasoning_chains) {
    for (let i = 0; i < chain.path.length - 1; i++) {
      const from = chain.path[i] as string;
      const to = chain.path[i + 1] as string;
      if (outgoing.has(from)) outgoing.get(from)!.add(to);
      if (!incoming.has(to)) incoming.set(to, new Set<string>());
      incoming.get(to)!.add(from);
    }
  }

  // Index chains by node
  for (const chain of ontology.edges.reasoning_chains) {
    for (const nodeId of chain.path) {
      const id = nodeId as string;
      if (!chainIndex.has(id)) chainIndex.set(id, []);
      chainIndex.get(id)!.push(chain);
    }
  }

  return { ontology, nodeIndex, domainIndex, outgoing, incoming, chainIndex };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Retrieve any node by ID. Returns null if not found. */
export function getNode(graph: OntologyGraph, id: string): BaseNode | null {
  return graph.nodeIndex.get(id) ?? null;
}

/** Get direct neighbors of a node in the given direction. */
export function getConnections(
  graph: OntologyGraph,
  id: string,
  direction: "in" | "out" | "both"
): BaseNode[] {
  const ids = new Set<string>();

  if (direction === "out" || direction === "both") {
    for (const target of graph.outgoing.get(id) ?? []) {
      ids.add(target);
    }
  }
  if (direction === "in" || direction === "both") {
    for (const source of graph.incoming.get(id) ?? []) {
      ids.add(source);
    }
  }

  const nodes: BaseNode[] = [];
  for (const nid of ids) {
    const node = graph.nodeIndex.get(nid);
    if (node) nodes.push(node);
  }
  return nodes;
}

/** Get all reasoning chains that pass through a node. */
export function getChainsForNode(
  graph: OntologyGraph,
  id: string
): ReasoningChain[] {
  return graph.chainIndex.get(id) ?? [];
}

/**
 * Follow all paths from an intent node to visual_properties nodes.
 * Uses BFS with cycle detection.
 */
export function traverseIntentToVisual(
  graph: OntologyGraph,
  intentId: string
): TraversalResult {
  return traverseToTarget(graph, [intentId], "visual_properties", 10);
}

/**
 * Given a context with optional intent, audience, and emotion IDs,
 * find all relevant visual property nodes by traversing from each.
 */
export function resolveVisualProperties(
  graph: OntologyGraph,
  context: {
    intentIds?: string[];
    audienceIds?: string[];
    emotionIds?: string[];
  }
): VisualPropertyNode[] {
  const startIds = [
    ...(context.intentIds ?? []),
    ...(context.audienceIds ?? []),
    ...(context.emotionIds ?? []),
  ];

  if (startIds.length === 0) return [];

  const result = traverseToTarget(graph, startIds, "visual_properties", 10);
  return result.visual_properties;
}

/**
 * Fuzzy match a description against anti-pattern labels, descriptions,
 * and why_prohibited fields. Returns potential violations.
 */
export function checkAntiPatterns(
  graph: OntologyGraph,
  description: string
): AntiPattern[] {
  if (!graph.ontology.anti_patterns) return [];

  const lower = description.toLowerCase();
  const words = lower
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const matches: { ap: AntiPattern; score: number }[] = [];

  for (const ap of Object.values(graph.ontology.anti_patterns)) {
    const searchable = [
      ap.label,
      ap.description,
      ap.why_prohibited,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of words) {
      if (searchable.includes(word)) score++;
    }

    if (score > 0) {
      matches.push({ ap, score });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .map((m) => m.ap);
}

/**
 * Simple text search across node labels, descriptions, short descriptions,
 * and other text fields. Optionally filter by domain.
 */
export function searchNodes(
  graph: OntologyGraph,
  query: string,
  domain?: DomainName
): BaseNode[] {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);

  const scored: { node: BaseNode; score: number }[] = [];

  for (const [id, node] of graph.nodeIndex) {
    // Domain filter
    if (domain && graph.domainIndex.get(id) !== domain) continue;

    const searchable = [
      node.label,
      node.short,
      node.description,
      node.principle,
      node.implication,
      node.specification,
      node.reasoning,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of words) {
      if (searchable.includes(word)) score++;
    }

    if (score > 0) {
      scored.push({ node, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.node);
}

// ---------------------------------------------------------------------------
// Internal traversal
// ---------------------------------------------------------------------------

/**
 * BFS traversal from one or more starting nodes to a target domain.
 * Returns all paths found, target-domain nodes reached, and a reasoning summary.
 */
function traverseToTarget(
  graph: OntologyGraph,
  startIds: string[],
  targetDomain: DomainName,
  maxDepth: number
): TraversalResult {
  const paths: string[][] = [];
  const reachedTargets = new Map<string, BaseNode>();
  const reasoningParts: string[] = [];

  for (const startId of startIds) {
    if (!graph.nodeIndex.has(startId)) continue;

    // BFS: each queue item is [currentNodeId, pathSoFar]
    const queue: [string, string[]][] = [[startId, [startId]]];
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const [currentId, currentPath] = queue.shift()!;

      // Check if we reached a target-domain node (that isn't the start)
      if (
        graph.domainIndex.get(currentId) === targetDomain &&
        currentId !== startId
      ) {
        paths.push([...currentPath]);
        const node = graph.nodeIndex.get(currentId);
        if (node) reachedTargets.set(currentId, node);
        // Don't continue traversing past target nodes
        continue;
      }

      // Stop if we hit max depth
      if (currentPath.length >= maxDepth) continue;

      // Collect reasoning from current node
      const node = graph.nodeIndex.get(currentId);
      if (node?.reasoning && !reasoningParts.includes(node.reasoning)) {
        reasoningParts.push(node.reasoning);
      }

      // Expand outgoing edges
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
    visual_properties: Array.from(reachedTargets.values()) as VisualPropertyNode[],
    reasoning_summary: reasoningParts.join(" "),
  };
}
