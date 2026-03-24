# design-ontology

An open specification and toolchain for teaching AI agents *why* behind design decisions, not just *what*.

## The problem

Every AI code-generation tool produces the same UI. Ask for a "dashboard" and you get the same card grid, the same blue primary, the same 8px border-radius. The output is technically correct but contextually meaningless because the model has no access to the reasoning behind design decisions -- it only sees the tokens. Design systems tell the AI *what* to use; nothing tells it *why*.

## The GPS analogy

- **Design tokens** are street names. They label things but don't tell you where to go.
- **Design systems** are paper maps. They show the full territory but require the reader to plan the route.
- **Design ontology** is GPS navigation. It encodes the destination (user intent), the constraints (psychology, culture, audience), and computes the route to concrete visual properties -- with reasoning at every turn.

## Quick start

```bash
# Scaffold a design-ontology.json from a product spec or description
npx design-ontology init

# Validate the ontology against the JSON Schema
npx design-ontology validate

# Or point the MCP server at your ontology (see IDE Setup below)
```

## How it works

```
Product spec / description
        |
        v
  npx design-ontology init     --> design-ontology.json
        |
        v
  npx design-ontology validate --> schema + referential integrity checks
        |
        v
  MCP Server (6 tools)         --> AI agent queries reasoning at generation time
        |
        v
  AI generates UI               with context-aware design decisions
```

The ontology file is a JSON knowledge graph. Nodes represent design concepts across seven domains. Edges encode reasoning chains from user intent to visual output. The MCP server exposes this graph to any AI agent that supports the Model Context Protocol.

## Schema overview

The ontology is organized into seven domain groups, each representing a layer of design reasoning:

| Domain | Prefix | What it encodes |
|---|---|---|
| `intents` | `INT-` | What users are trying to accomplish |
| `psychology` | `PSY-` | Cognitive principles influencing design (load, attention, trust) |
| `culture` | `CUL-` | Cultural context shaping perception (color, formality, reading patterns) |
| `emotions` | `EMO-` | Emotional states the design should evoke or manage |
| `audience` | `AUD-` | Target audience segments and their characteristics |
| `visual_properties` | `VIS-` | Concrete visual specs: colors, typography, spacing, layout |
| `accessibility` | `A11Y-` | Accessibility requirements constraining visual decisions |

**Reasoning chains** connect nodes across domains into traversable paths. A chain might run `INT-001 -> PSY-003 -> CUL-002 -> VIS-007`, encoding *why* a specific visual property exists for a specific intent.

**Anti-patterns** (`ANTI-xxx`) encode design decisions the ontology explicitly prohibits, with reasoning for why they are harmful.

See the full schema at [`schema/design-ontology.schema.json`](schema/design-ontology.schema.json).

## MCP tools

The MCP server exposes six tools to AI agents:

| Tool | Description |
|---|---|
| `get_node` | Retrieve a node by ID with its full description, reasoning, and connections |
| `get_chain` | Retrieve a reasoning chain -- the full path from intent to visual properties |
| `traverse` | Walk the graph from starting nodes to a target domain, returning all paths |
| `check_anti_patterns` | Check a proposed design approach against prohibited anti-patterns |
| `resolve_for_component` | The primary tool for UI generation -- describe a component, get all relevant reasoning, properties, and warnings |
| `search` | Free-text search across nodes, optionally filtered by domain |

## IDE setup

### Claude Code

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"],
      "env": {
        "ONTOLOGY_PATH": "./design-ontology.json"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"],
      "env": {
        "ONTOLOGY_PATH": "./design-ontology.json"
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"],
      "env": {
        "ONTOLOGY_PATH": "./design-ontology.json"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"],
      "env": {
        "ONTOLOGY_PATH": "./design-ontology.json"
      }
    }
  }
}
```

## Examples

See [`examples/ecovoorscan/`](examples/ecovoorscan/) for a complete ontology built for a real product.

## Philosophy

See [`docs/philosophy.md`](docs/philosophy.md).

## Contributing

See [`docs/contributing.md`](docs/contributing.md).

## License

MIT
