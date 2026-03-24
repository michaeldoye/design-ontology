# design-ontology

An open specification and toolchain for teaching AI agents *why* behind design decisions, not just *what*.

Design tokens tell machines what values to use. Design systems tell them what to build. Design ontology tells them *why* — encoding reasoning from user intent through psychology, culture, and audience to concrete visual properties.

## Setup

### Step 1: Generate your ontology

Write a [product spec](docs/writing-specs.md) describing your product's audience, goals, culture, and constraints. Then generate an ontology from it:

```bash
npx design-ontology init spec.md
```

The CLI will prompt you for an API key on first run (Anthropic or OpenAI) and save it for future use. You can also set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` as environment variables.

This outputs a `design-ontology.json` file — a knowledge graph encoding the reasoning behind your product's design decisions.

### Step 2: Validate

```bash
npx design-ontology validate
```

### Step 3: Connect to your IDE

Add the MCP server config so AI agents can query the ontology while generating code.

**Claude Code** — add `.mcp.json` to your project root:

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

<details>
<summary>Cursor, Windsurf, VS Code</summary>

**Cursor** — add `.cursor/mcp.json`:

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

**Windsurf** — add to your Windsurf MCP configuration:

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

**VS Code** — add `.vscode/mcp.json`:

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

</details>

### Step 4: Use it

Ask your AI agent to build a component. The MCP server gives it access to your ontology's reasoning, visual properties, and anti-patterns automatically.

To verify it's working, ask: *"Using the design ontology, what visual properties apply to the primary user intent?"*

---

## How it works

```
spec.md  -->  npx design-ontology init  -->  design-ontology.json  -->  MCP Server  -->  AI agent
```

The ontology is a JSON knowledge graph. Nodes represent design concepts across seven domains. Reasoning chains connect them into traversable paths from user intent to visual output. The MCP server exposes this graph as queryable tools.

### The seven domains

| Domain | Prefix | What it encodes |
|---|---|---|
| `intents` | `INT-` | What users are trying to accomplish |
| `psychology` | `PSY-` | Cognitive principles (load, attention, trust) |
| `culture` | `CUL-` | Cultural context (color meaning, formality, reading patterns) |
| `emotions` | `EMO-` | Emotional states the design should evoke or manage |
| `audience` | `AUD-` | Target audience segments and their characteristics |
| `visual_properties` | `VIS-` | Concrete specs: colors, typography, spacing, layout |
| `accessibility` | `A11Y-` | Accessibility requirements constraining visual decisions |

**Reasoning chains** connect nodes across domains: `INT-001 -> PSY-003 -> CUL-002 -> VIS-007` encodes *why* a visual property exists for a given intent.

**Anti-patterns** encode what NOT to do, with reasoning for why.

### MCP tools

The MCP server exposes six tools to AI agents:

| Tool | Description |
|---|---|
| `get_node` | Retrieve a node by ID with its description, reasoning, and connections |
| `get_chain` | Retrieve a reasoning chain with every node expanded |
| `traverse` | Walk the graph from starting nodes to a target domain |
| `check_anti_patterns` | Check a proposed design approach against prohibited patterns |
| `resolve_for_component` | Describe what you're building, get all relevant reasoning and properties |
| `search` | Free-text search across nodes, optionally filtered by domain |

## CLI reference

```bash
npx design-ontology init [spec-file]        # Generate ontology from spec (LLM)
npx design-ontology validate [ontology-file] # Validate against schema
npx design-ontology update [ontology-file]   # Evolve ontology with a change description
```

Use `--help` on any command for full options.

## Why?

Every AI tool produces the same UI because models have no access to design reasoning — only tokens and component names. Design ontology encodes the *why*: the psychology, culture, audience, and intent behind every visual decision, in a format machines can traverse.

See [docs/philosophy.md](docs/philosophy.md) for the full argument.

## Examples

See [`examples/ecovoorscan/`](examples/ecovoorscan/) for a complete ontology built for a Dutch sustainability assessment platform — 31 nodes, 8 reasoning chains, 6 anti-patterns.

## License

MIT
