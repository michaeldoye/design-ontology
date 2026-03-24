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

  // Validator
  ValidationResult,
  ValidationError,

  // Graph
  OntologyGraph,
  TraversalResult,
} from "./core/index.js";

export {
  validateOntology,
  buildGraph,
  getNode,
  getConnections,
  getChainsForNode,
  traverseIntentToVisual,
  resolveVisualProperties,
  checkAntiPatterns,
  searchNodes,
} from "./core/index.js";
