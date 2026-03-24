# Design Ontology Schema Reference

This document describes every field in the `design-ontology.schema.json` specification. The schema uses JSON Schema Draft 2020-12.

---

## Top-Level Structure

A design ontology file is a JSON object with the following properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `meta` | object | Yes | Metadata about the ontology and its product |
| `nodes` | object | Yes | All nodes organized by domain group |
| `edges` | object | Yes | Reasoning chains connecting nodes |
| `anti_patterns` | object | No | Design decisions explicitly prohibited |
| `generation_instructions` | object | No | Instructions for AI agents using this ontology |

---

## `meta` — Ontology Metadata

| Property | Type | Required | Description | Example |
|---|---|---|---|---|
| `product` | string | Yes | Name of the product | `"EcoVoorscan"` |
| `version` | string (semver) | Yes | Ontology version | `"1.0.0"` |
| `generated` | string (ISO 8601) | Yes | When the ontology was generated | `"2025-05-15T10:30:00Z"` |
| `purpose` | string | Yes | What this ontology encodes | `"Design reasoning for a sustainability assessment platform"` |
| `schema_version` | string (semver) | No | Schema version this file conforms to | `"1.0.0"` |

---

## `nodes` — Domain Groups

Nodes are the building blocks of the ontology. They are organized into seven domain groups, each representing a layer of design reasoning.

### The Seven Domains

| Domain | ID Prefix | Purpose |
|---|---|---|
| `intents` | `INT-xxx` | What users are trying to accomplish. Starting points for reasoning chains. |
| `psychology` | `PSY-xxx` | Cognitive and psychological principles influencing design (cognitive load, trust, attention). |
| `culture` | `CUL-xxx` | Cultural context shaping perception (color associations, formality, reading patterns). |
| `emotions` | `EMO-xxx` | Emotional states the design should evoke, manage, or support. |
| `audience` | `AUD-xxx` | Target audience segments, their expertise, and needs. |
| `visual_properties` | `VIS-xxx` | Concrete visual specifications — the endpoints of reasoning chains. |
| `accessibility` | `A11Y-xxx` | Accessibility requirements constraining visual property decisions. |

**Why these seven?** They represent the full reasoning path a human designer follows: understanding the user's goal (intent), applying cognitive science (psychology), accounting for context (culture), managing emotional response (emotions), tailoring to the audience, and arriving at concrete visual decisions — all constrained by accessibility requirements. The seven domains turn implicit design intuition into explicit, traversable reasoning.

### How Domains Relate

The typical flow moves left to right:

```
intents → psychology → culture → emotions → audience → visual_properties
                                                  ↑
                                          accessibility ──┘
```

Nodes connect across domains via `connects_to`. A single intent node might connect to multiple psychology nodes, which connect to culture and emotion nodes, which ultimately connect to visual property nodes. Accessibility nodes act as constraints on visual properties.

### Node Object

Each node within a domain group is keyed by its node ID and has the following fields:

#### Required Fields

| Property | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique ID matching the key. Pattern: `^[A-Z][A-Z0-9]{1,4}-\d{3}$` | `"INT-001"` |
| `label` | string | Human-readable name | `"Risk Assessment"` |
| `description` | string (max 500 chars) | What this node represents and why it exists | `"Users need to quickly assess environmental risk levels..."` |
| `connects_to` | string[] | Node IDs this node connects to | `["PSY-001", "PSY-003"]` |

#### Optional Fields

| Property | Type | Description | Example |
|---|---|---|---|
| `short` | string (max 50 chars) | Concise label for visualizations | `"Risk assessment"` |
| `principle` | string | Design principle this node embodies | `"Progressive disclosure reduces cognitive load"` |
| `implication` | string | Actionable consequence of the principle | `"Show summary first, details on demand"` |
| `anti_pattern` | string | What NOT to do related to this node | `"Don't show all data fields simultaneously"` |
| `specification` | string | Concrete value or spec | `"font-size: 16px; line-height: 1.5"` |
| `property_type` | string | Type of visual property | `"typography"`, `"color"`, `"spacing"`, `"layout"` |
| `derived_from` | string[] | Node IDs this reasoning derives from | `["PSY-001", "CUL-002"]` |
| `reasoning` | string | Why this design decision was made | `"Dutch professionals expect data density..."` |
| `rule` | string | Implementable rule | `"Always show confidence intervals with risk scores"` |
| `phase` | string | User journey phase | `"onboarding"`, `"active-use"`, `"error-recovery"` |
| `state` | string | UI state this applies to | `"loading"`, `"empty"`, `"error"`, `"success"` |
| `ui_response` | string | How the UI should respond | `"Highlight changed values with a brief pulse animation"` |
| `role` | string | Most relevant user role | `"Construction professional"` |
| `expertise` | string | Assumed expertise level | `"novice"`, `"intermediate"`, `"expert"` |
| `constraints` | string[] | Technical or design constraints | `["Must work on mobile", "Max 3 colors"]` |
| `linguistic_examples` | string[] | Example phrases or microcopy | `["Risico: Hoog", "Actie vereist"]` |

---

## `edges` — Reasoning Chains

Edges connect nodes across the ontology. Currently the only edge type is `reasoning_chains`.

### What Is a Reasoning Chain?

A reasoning chain is a named, weighted path through the ontology graph. It encodes the *why* behind a design decision by connecting a user intent through intermediate reasoning (psychology, culture, emotions, audience) to concrete visual properties.

**Path ordering matters.** The first node is typically the starting intent, and the last nodes are typically visual properties. Intermediate nodes are ordered by the reasoning flow — the order in which a designer would think through the decision.

**Weight** indicates importance. When two chains suggest conflicting visual properties, the higher-weight chain takes priority.

| Weight | Meaning |
|---|---|
| 1 | Supplementary — nice to have |
| 2 | Supportive — reinforces other chains |
| 3 | Standard — normal importance |
| 4 | Important — core to the product |
| 5 | Critical — must not be overridden |

### Chain Object

| Property | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | string | Yes | Unique ID. Pattern: `^CHAIN-\d{3}$` | `"CHAIN-001"` |
| `name` | string | Yes | Human-readable name | `"Risk Assessment to Visual Hierarchy"` |
| `path` | string[] (min 3) | Yes | Ordered array of node IDs | `["INT-001", "PSY-001", "VIS-003"]` |
| `description` | string | Yes | Narrative explanation of the reasoning | `"From risk assessment intent through..."` |
| `weight` | integer (1-5) | Yes | Importance weight | `4` |

---

## `anti_patterns` — What Not To Do

Anti-patterns are design decisions explicitly prohibited by the ontology. They differ from nodes in that they don't participate in the graph — they stand apart as guardrails.

**When to use anti-patterns vs. node-level `anti_pattern` fields:** Use top-level anti-patterns for broad, cross-cutting prohibitions (e.g., "Generic Dashboard Layout"). Use the node-level `anti_pattern` field for node-specific warnings (e.g., "Don't use red for non-error states" on a color node).

Anti-patterns are keyed by ID (pattern: `^ANTI-\d{3}$`).

### Anti-Pattern Object

| Property | Type | Required | Description | Example |
|---|---|---|---|---|
| `label` | string | Yes | Short name | `"Generic Dashboard Layout"` |
| `description` | string | Yes | What this looks like in practice | `"Using a standard SaaS dashboard grid..."` |
| `why_prohibited` | string | Yes | Why this is prohibited | `"Construction professionals need task-oriented..."` |
| `traces_to` | string[] (min 1) | Yes | Node IDs whose principles are violated | `["INT-001", "AUD-001"]` |

---

## `generation_instructions` — AI Agent Guidance

Optional section providing AI agents with a recommended process for using the ontology during code generation.

| Property | Type | Description |
|---|---|---|
| `process` | string[] | Ordered steps to follow |
| `example_traversal` | object | A worked example traversal (freeform structure) |

---

## ID Naming Conventions

Every node and structural element has a predictable ID format:

| Entity | Pattern | Example |
|---|---|---|
| Intent node | `INT-xxx` | `INT-001` |
| Psychology node | `PSY-xxx` | `PSY-001` |
| Culture node | `CUL-xxx` | `CUL-001` |
| Emotion node | `EMO-xxx` | `EMO-001` |
| Audience node | `AUD-xxx` | `AUD-001` |
| Visual property node | `VIS-xxx` | `VIS-001` |
| Accessibility node | `A11Y-xxx` | `A11Y-001` |
| Reasoning chain | `CHAIN-xxx` | `CHAIN-001` |
| Anti-pattern | `ANTI-xxx` | `ANTI-001` |

**Why structured IDs?** They make traversal logs human-readable. When an AI agent reports "Resolved VIS-012 via CHAIN-003 from INT-001", a developer can immediately identify which visual property, chain, and intent are involved without looking up labels.

---

## Referential Integrity

The JSON Schema validates structure but cannot enforce cross-references between nodes. The following constraints are enforced programmatically by the validator (`src/core/validator.ts`):

- Every ID in `connects_to` arrays must exist as a node key in `nodes`
- Every ID in reasoning chain `path` arrays must exist as a node key
- Every ID in anti-pattern `traces_to` arrays must exist as a node key
- Every ID in `derived_from` arrays must exist as a node key
- No duplicate node IDs across domain groups

---

## Examples

### Minimal Valid Ontology

The fewest possible fields to pass schema validation:

```json
{
  "meta": {
    "product": "My Product",
    "version": "1.0.0",
    "generated": "2025-01-01T00:00:00Z",
    "purpose": "Design reasoning for My Product"
  },
  "nodes": {
    "intents": {
      "INT-001": {
        "id": "INT-001",
        "label": "Core Task",
        "description": "The primary task users perform in this product.",
        "connects_to": ["VIS-001"]
      }
    },
    "psychology": {},
    "culture": {},
    "emotions": {},
    "audience": {},
    "visual_properties": {
      "VIS-001": {
        "id": "VIS-001",
        "label": "Primary Layout",
        "description": "The main layout structure for the core task view.",
        "connects_to": []
      }
    },
    "accessibility": {}
  },
  "edges": {
    "reasoning_chains": [
      {
        "id": "CHAIN-001",
        "name": "Core Task to Layout",
        "path": ["INT-001", "VIS-001", "VIS-001"],
        "description": "Direct path from the core task intent to the primary layout.",
        "weight": 3
      }
    ]
  }
}
```

### Complete Ontology (All Optional Fields)

An example showing every field populated:

```json
{
  "meta": {
    "product": "EcoVoorscan",
    "version": "1.0.0",
    "generated": "2025-05-15T10:30:00Z",
    "purpose": "Design reasoning for a Dutch sustainability assessment platform used by construction professionals",
    "schema_version": "1.0.0"
  },
  "nodes": {
    "intents": {
      "INT-001": {
        "id": "INT-001",
        "label": "Risk Assessment",
        "short": "Risk assessment",
        "description": "Users need to quickly assess environmental risk levels for construction projects and understand the severity and required actions.",
        "connects_to": ["PSY-001", "EMO-001"],
        "principle": "Risk visibility drives informed decision-making",
        "implication": "Risk levels must be immediately visible without interaction",
        "anti_pattern": "Don't hide risk behind navigation",
        "reasoning": "Construction professionals make time-critical safety decisions",
        "rule": "Risk score must be visible within 2 seconds of page load",
        "phase": "active-use",
        "state": "loaded",
        "ui_response": "Display risk score prominently with color-coded severity",
        "role": "Construction professional",
        "expertise": "expert",
        "constraints": ["Must work on tablet in field conditions", "Sunlight-readable contrast"],
        "linguistic_examples": ["Risico: Hoog", "Actie vereist", "Veilig"]
      }
    },
    "psychology": {
      "PSY-001": {
        "id": "PSY-001",
        "label": "Cognitive Load Management",
        "short": "Cognitive load",
        "description": "Minimize cognitive load for users processing complex environmental data under time pressure.",
        "connects_to": ["VIS-001"],
        "principle": "Progressive disclosure reduces cognitive overload",
        "implication": "Show summary first, expand to details on demand",
        "derived_from": ["INT-001"]
      }
    },
    "culture": {
      "CUL-001": {
        "id": "CUL-001",
        "label": "Dutch Professional Communication",
        "short": "Dutch directness",
        "description": "Dutch professional culture values directness, efficiency, and data-driven communication over decoration.",
        "connects_to": ["VIS-001"],
        "principle": "Direct communication is preferred over indirect",
        "implication": "Use plain language, avoid euphemisms for risk"
      }
    },
    "emotions": {
      "EMO-001": {
        "id": "EMO-001",
        "label": "Professional Confidence",
        "short": "Confidence",
        "description": "Users should feel confident in the data they are seeing and the decisions they make based on it.",
        "connects_to": ["VIS-001"],
        "principle": "Confidence comes from data transparency",
        "implication": "Always show data sources and confidence intervals"
      }
    },
    "audience": {
      "AUD-001": {
        "id": "AUD-001",
        "label": "Construction Professional",
        "short": "Construction pro",
        "description": "Experienced construction professionals who need environmental compliance data for project planning.",
        "connects_to": ["VIS-001"],
        "role": "Site manager or project lead",
        "expertise": "expert",
        "constraints": ["Field use on tablets", "Gloved interaction", "Variable lighting"]
      }
    },
    "visual_properties": {
      "VIS-001": {
        "id": "VIS-001",
        "label": "Data-Dense Layout",
        "short": "Dense layout",
        "description": "A compact, information-dense layout optimized for professional data consumption with clear visual hierarchy.",
        "connects_to": ["A11Y-001"],
        "specification": "max-width: 1200px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px",
        "property_type": "layout",
        "derived_from": ["PSY-001", "CUL-001", "AUD-001"],
        "reasoning": "Construction professionals expect data density similar to engineering tools, not consumer app spaciousness"
      }
    },
    "accessibility": {
      "A11Y-001": {
        "id": "A11Y-001",
        "label": "WCAG AA Contrast",
        "short": "AA contrast",
        "description": "All text and interactive elements must meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text).",
        "connects_to": [],
        "specification": "contrast-ratio: >= 4.5:1 (normal), >= 3:1 (large)",
        "rule": "Test all color combinations against WCAG AA before shipping"
      }
    }
  },
  "edges": {
    "reasoning_chains": [
      {
        "id": "CHAIN-001",
        "name": "Risk Assessment to Data-Dense Layout",
        "path": ["INT-001", "PSY-001", "CUL-001", "VIS-001", "A11Y-001"],
        "description": "From the risk assessment intent through cognitive load management and Dutch professional communication norms to a data-dense, accessible layout.",
        "weight": 5
      }
    ]
  },
  "anti_patterns": {
    "ANTI-001": {
      "label": "Generic Dashboard Layout",
      "description": "Using a standard SaaS dashboard grid with large cards, excessive whitespace, and decorative elements.",
      "why_prohibited": "Construction professionals need task-oriented, data-dense interfaces. Generic dashboards waste screen space and increase time-to-insight.",
      "traces_to": ["INT-001", "AUD-001", "CUL-001"]
    }
  },
  "generation_instructions": {
    "process": [
      "1. Identify the user intent most relevant to the component being built",
      "2. Traverse from that intent through psychology, culture, and emotion nodes",
      "3. Collect all visual property nodes reached by the traversal",
      "4. Check the component against anti-patterns",
      "5. Apply visual properties while respecting accessibility constraints"
    ],
    "example_traversal": {
      "component": "Risk score card",
      "starting_intent": "INT-001",
      "path": ["INT-001", "PSY-001", "CUL-001", "VIS-001"],
      "resolved_properties": ["Data-dense layout with compact spacing"],
      "anti_patterns_checked": ["ANTI-001"]
    }
  }
}
```

---

## Validating an Ontology

Use the CLI validator to check an ontology against this schema:

```bash
npx design-ontology validate ./design-ontology.json
```

This runs both JSON Schema validation and programmatic referential integrity checks. See the [CLI guide](../docs/cli-guide.md) for details.