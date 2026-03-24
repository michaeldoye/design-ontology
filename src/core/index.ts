export type {
  // ID types
  NodeId,
  IntentId,
  PsychologyId,
  CultureId,
  EmotionId,
  AudienceId,
  VisualPropertyId,
  AccessibilityId,
  ChainId,
  AntiPatternId,

  // Node types
  BaseNode,
  IntentNode,
  PsychologyNode,
  CultureNode,
  EmotionNode,
  AudienceNode,
  VisualPropertyNode,
  AccessibilityNode,
  OntologyNode,

  // Domain types
  DomainName,
  DomainGroup,
  NodeDomains,
  OntologyNodes,

  // Edge types
  ReasoningChain,
  OntologyEdges,

  // Anti-pattern & instructions
  AntiPattern,
  GenerationInstructions,

  // Meta & root
  OntologyMeta,
  DesignOntology,
} from "./types.js";

export { validateOntology } from "./validator.js";
export type { ValidationResult, ValidationError } from "./validator.js";

export {
  buildGraph,
  getNode,
  getConnections,
  getChainsForNode,
  traverseIntentToVisual,
  resolveVisualProperties,
  checkAntiPatterns,
  searchNodes,
} from "./graph.js";
export type { OntologyGraph, TraversalResult } from "./graph.js";
