# EcoVoorscan Example

This is a complete worked example of the design ontology specification.

## The Product

EcoVoorscan is a web-based sustainability assessment platform used in the Dutch construction industry. Construction professionals and ecology consultants use it to evaluate environmental risk before and during construction projects.

## What's Here

- **`spec.md`** — The product specification used as input to ontology generation. This is what you would pass to `npx design-ontology init`.
- **`design-ontology.json`** — The generated ontology. 31 nodes across 7 domains, 8 reasoning chains, and 6 anti-patterns.

## What the Ontology Covers

| Domain | Nodes | Key Concepts |
|---|---|---|
| Intents | 5 | Risk assessment, project comparison, report generation, field data entry, category deep dive |
| Psychology | 5 | Cognitive load, visual hierarchy, comparison cognition, regulatory confidence, error prevention |
| Culture | 4 | Dutch directness, data density, regulatory formality, construction color semantics |
| Emotions | 3 | Controlled urgency, submission confidence, frustration prevention |
| Audience | 2 | Construction professionals, ecology consultants |
| Visual Properties | 8 | Dense layout, typography, risk colors, microcopy, progressive disclosure, comparison grid, report UI, field inputs |
| Accessibility | 4 | Color independence, WCAG AA contrast, touch targets, screen reader support |

## How to Use It

Validate the ontology:

```bash
npx design-ontology validate examples/ecovoorscan/design-ontology.json
```

Use it with the MCP server:

```bash
ONTOLOGY_PATH=examples/ecovoorscan/design-ontology.json npx design-ontology-mcp
```

Or point your IDE's MCP configuration at it — see the [MCP setup guide](../../docs/mcp-guide.md).
