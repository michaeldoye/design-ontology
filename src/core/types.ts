// ---------------------------------------------------------------------------
// ID types — template literals matching the schema's regex patterns
// ---------------------------------------------------------------------------

export type IntentId = `INT-${string}`;
export type PsychologyId = `PSY-${string}`;
export type CultureId = `CUL-${string}`;
export type EmotionId = `EMO-${string}`;
export type AudienceId = `AUD-${string}`;
export type VisualPropertyId = `VIS-${string}`;
export type AccessibilityId = `A11Y-${string}`;

export type NodeId =
  | IntentId
  | PsychologyId
  | CultureId
  | EmotionId
  | AudienceId
  | VisualPropertyId
  | AccessibilityId;

export type ChainId = `CHAIN-${string}`;
export type AntiPatternId = `ANTI-${string}`;

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

/** Fields shared by every node in the ontology. */
export interface BaseNode {
  id: NodeId;
  label: string;
  description: string;
  connects_to: NodeId[];

  // Optional fields available on any node
  short?: string;
  principle?: string;
  implication?: string;
  anti_pattern?: string;
  specification?: string;
  property_type?: string;
  derived_from?: NodeId[];
  reasoning?: string;
  rule?: string;
  phase?: string;
  state?: string;
  ui_response?: string;
  role?: string;
  expertise?: string;
  constraints?: string[];
  linguistic_examples?: string[];
}

/** Intent node — what users are trying to accomplish. */
export interface IntentNode extends BaseNode {
  id: IntentId;
}

/** Psychology node — cognitive and psychological principles. */
export interface PsychologyNode extends BaseNode {
  id: PsychologyId;
}

/** Culture node — cultural context and conventions. */
export interface CultureNode extends BaseNode {
  id: CultureId;
}

/** Emotion node — emotional states the design addresses. */
export interface EmotionNode extends BaseNode {
  id: EmotionId;
}

/** Audience node — target audience segments and characteristics. */
export interface AudienceNode extends BaseNode {
  id: AudienceId;
}

/** Visual property node — concrete visual specifications. */
export interface VisualPropertyNode extends BaseNode {
  id: VisualPropertyId;
}

/** Accessibility node — accessibility requirements and guidelines. */
export interface AccessibilityNode extends BaseNode {
  id: AccessibilityId;
}

/** Union of all node types. */
export type OntologyNode =
  | IntentNode
  | PsychologyNode
  | CultureNode
  | EmotionNode
  | AudienceNode
  | VisualPropertyNode
  | AccessibilityNode;

// ---------------------------------------------------------------------------
// Domain groups
// ---------------------------------------------------------------------------

/** The seven domain group names. */
export type DomainName =
  | "intents"
  | "psychology"
  | "culture"
  | "emotions"
  | "audience"
  | "visual_properties"
  | "accessibility";

/** A keyed collection of nodes within a single domain. */
export type DomainGroup<T extends BaseNode = BaseNode> = Record<string, T>;

/** All node domain groups in the ontology. */
export interface NodeDomains {
  intents: DomainGroup<IntentNode>;
  psychology: DomainGroup<PsychologyNode>;
  culture: DomainGroup<CultureNode>;
  emotions: DomainGroup<EmotionNode>;
  audience: DomainGroup<AudienceNode>;
  visual_properties: DomainGroup<VisualPropertyNode>;
  accessibility: DomainGroup<AccessibilityNode>;
}

/** Alias used in public exports. */
export type OntologyNodes = NodeDomains;

// ---------------------------------------------------------------------------
// Reasoning chains (edges)
// ---------------------------------------------------------------------------

/** A named, weighted path through the ontology graph. */
export interface ReasoningChain {
  id: ChainId;
  name: string;
  path: NodeId[];
  description: string;
  weight: number;
}

/** The edges section of the ontology. */
export interface OntologyEdges {
  reasoning_chains: ReasoningChain[];
}

// ---------------------------------------------------------------------------
// Anti-patterns
// ---------------------------------------------------------------------------

/** A design decision explicitly prohibited by the ontology. */
export interface AntiPattern {
  label: string;
  description: string;
  why_prohibited: string;
  traces_to: NodeId[];
}

// ---------------------------------------------------------------------------
// Generation instructions
// ---------------------------------------------------------------------------

/** Optional instructions for AI agents using the ontology. */
export interface GenerationInstructions {
  process?: string[];
  example_traversal?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/** Ontology metadata. */
export interface OntologyMeta {
  product: string;
  version: string;
  generated: string;
  purpose: string;
  schema_version?: string;
}

// ---------------------------------------------------------------------------
// Root type
// ---------------------------------------------------------------------------

/** A complete design ontology. */
export interface DesignOntology {
  meta: OntologyMeta;
  nodes: OntologyNodes;
  edges: OntologyEdges;
  anti_patterns?: Record<string, AntiPattern>;
  generation_instructions?: GenerationInstructions;
}
