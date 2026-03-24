import type { DesignOntology } from "../src/core/types.js";

/**
 * Minimal valid ontology for testing.
 */
export const MINIMAL_ONTOLOGY: DesignOntology = {
  meta: {
    product: "Test Product",
    version: "1.0.0",
    generated: "2025-01-01T00:00:00Z",
    purpose: "Test ontology",
  },
  nodes: {
    intents: {
      "INT-001": {
        id: "INT-001" as const,
        label: "Core Task",
        description: "Primary task users perform.",
        connects_to: ["PSY-001" as const],
      },
    },
    psychology: {
      "PSY-001": {
        id: "PSY-001" as const,
        label: "Cognitive Load",
        description: "Minimize cognitive load.",
        connects_to: ["VIS-001" as const],
        principle: "Progressive disclosure",
        derived_from: ["INT-001" as const],
      },
    },
    culture: {},
    emotions: {},
    audience: {},
    visual_properties: {
      "VIS-001": {
        id: "VIS-001" as const,
        label: "Layout",
        description: "Main layout specification.",
        connects_to: ["A11Y-001" as const],
        specification: "max-width: 1200px",
        property_type: "layout",
        derived_from: ["PSY-001" as const],
      },
    },
    accessibility: {
      "A11Y-001": {
        id: "A11Y-001" as const,
        label: "Contrast",
        description: "WCAG AA contrast.",
        connects_to: [],
        rule: "4.5:1 minimum",
      },
    },
  },
  edges: {
    reasoning_chains: [
      {
        id: "CHAIN-001" as const,
        name: "Task to Layout",
        path: ["INT-001" as const, "PSY-001" as const, "VIS-001" as const],
        description: "From task through psychology to layout.",
        weight: 4,
      },
    ],
  },
  anti_patterns: {
    "ANTI-001": {
      label: "Generic Dashboard",
      description: "Standard SaaS dashboard grid with large cards.",
      why_prohibited: "Users need task-oriented interfaces.",
      traces_to: ["INT-001" as const, "VIS-001" as const],
    },
  },
};

/**
 * A richer ontology for thorough testing.
 */
export const RICH_ONTOLOGY: DesignOntology = {
  meta: {
    product: "EcoVoorscan",
    version: "1.0.0",
    generated: "2025-05-15T10:00:00Z",
    purpose: "Dutch sustainability assessment platform",
    schema_version: "1.0.0",
  },
  nodes: {
    intents: {
      "INT-001": {
        id: "INT-001" as const,
        label: "Risk Assessment",
        short: "Risk review",
        description: "Assess environmental risk for construction projects.",
        connects_to: ["PSY-001" as const, "PSY-002" as const, "EMO-001" as const, "CUL-001" as const],
      },
      "INT-002": {
        id: "INT-002" as const,
        label: "Project Comparison",
        short: "Compare",
        description: "Compare risk profiles across sites.",
        connects_to: ["PSY-001" as const],
      },
    },
    psychology: {
      "PSY-001": {
        id: "PSY-001" as const,
        label: "Cognitive Load",
        description: "Manage cognitive load for data-dense interfaces.",
        connects_to: ["VIS-001" as const],
        principle: "Progressive disclosure",
      },
      "PSY-002": {
        id: "PSY-002" as const,
        label: "Visual Hierarchy",
        description: "F-pattern scanning for critical data.",
        connects_to: ["VIS-002" as const],
      },
    },
    culture: {
      "CUL-001": {
        id: "CUL-001" as const,
        label: "Dutch Directness",
        description: "Direct risk communication without hedging.",
        connects_to: ["VIS-003" as const],
        linguistic_examples: ["Hoog risico", "Actie vereist"],
      },
    },
    emotions: {
      "EMO-001": {
        id: "EMO-001" as const,
        label: "Controlled Urgency",
        description: "Urgency without panic.",
        connects_to: ["VIS-003" as const],
      },
    },
    audience: {
      "AUD-001": {
        id: "AUD-001" as const,
        label: "Construction Professional",
        description: "Expert site managers.",
        connects_to: ["VIS-001" as const],
        expertise: "expert",
      },
    },
    visual_properties: {
      "VIS-001": {
        id: "VIS-001" as const,
        label: "Dense Layout",
        description: "Compact data-dense layout.",
        connects_to: ["A11Y-001" as const],
        specification: "max-width: 1400px; gap: 12px",
        property_type: "layout",
        reasoning: "Construction pros expect engineering-tool density.",
      },
      "VIS-002": {
        id: "VIS-002" as const,
        label: "Typography Scale",
        description: "Professional compact typography.",
        connects_to: ["A11Y-001" as const],
        specification: "body: 14px; heading: 16px/600",
        property_type: "typography",
      },
      "VIS-003": {
        id: "VIS-003" as const,
        label: "Risk Colors",
        description: "Four-tier risk color system.",
        connects_to: ["A11Y-001" as const],
        specification: "critical: #DC2626; warning: #EA580C; caution: #CA8A04; safe: #16A34A",
        property_type: "color",
      },
    },
    accessibility: {
      "A11Y-001": {
        id: "A11Y-001" as const,
        label: "WCAG AA Contrast",
        description: "4.5:1 contrast minimum.",
        connects_to: [],
        rule: "All text meets WCAG AA",
      },
    },
  },
  edges: {
    reasoning_chains: [
      {
        id: "CHAIN-001" as const,
        name: "Risk to Layout",
        path: ["INT-001" as const, "PSY-001" as const, "VIS-001" as const, "A11Y-001" as const],
        description: "Risk assessment to dense layout.",
        weight: 5,
      },
      {
        id: "CHAIN-002" as const,
        name: "Risk to Colors",
        path: ["INT-001" as const, "CUL-001" as const, "EMO-001" as const, "VIS-003" as const],
        description: "Risk communication to color system.",
        weight: 5,
      },
      {
        id: "CHAIN-003" as const,
        name: "Risk to Typography",
        path: ["INT-001" as const, "PSY-002" as const, "VIS-002" as const],
        description: "Visual hierarchy to typography.",
        weight: 3,
      },
    ],
  },
  anti_patterns: {
    "ANTI-001": {
      label: "Generic Dashboard",
      description: "Standard SaaS dashboard with large cards and whitespace.",
      why_prohibited: "Task-oriented density needed.",
      traces_to: ["INT-001" as const, "VIS-001" as const],
    },
    "ANTI-002": {
      label: "Softened Language",
      description: "Using hedging language for risk levels.",
      why_prohibited: "Dutch directness requires plain risk labels.",
      traces_to: ["CUL-001" as const, "VIS-003" as const],
    },
  },
};
