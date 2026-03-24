# design-ontology

An open specification and toolchain for teaching AI agents *why* behind design decisions, not just *what*.

Design tokens tell machines what values to use. Design systems tell them what to build. Design ontology tells them *why* — encoding reasoning from user intent through psychology, culture, and audience to concrete visual properties.

## Setup

### Step 1: Add the MCP server to your IDE

**Claude Code** — add `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"]
    }
  }
}
```

<details>
<summary>Cursor, Windsurf, VS Code</summary>

**Cursor** — `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"]
    }
  }
}
```

**Windsurf** — MCP configuration:
```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"]
    }
  }
}
```

**VS Code** — `.vscode/mcp.json`:
```json
{
  "servers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "design-ontology"]
    }
  }
}
```

</details>

### Step 2: Generate your ontology

Ask your AI agent:

> Read my product spec (spec.md) and use the generate_ontology tool to create a design ontology for this product.

The agent generates the ontology itself — no API keys or external accounts needed. It validates and saves a `design-ontology.json` in your project.

### Step 3: Build with it

The MCP server automatically loads your ontology. When you ask your AI agent to build UI components, it can query the ontology for design reasoning, visual properties, and anti-patterns.

Try: *"Using the design ontology, build a risk assessment card component."*

---

## How it works

The ontology is a JSON knowledge graph. Nodes represent design concepts across seven domains. Reasoning chains connect them into traversable paths from user intent to visual output.

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

## MCP tools

| Tool | Description |
|---|---|
| `generate_ontology` | Generate an ontology from a product spec (the agent does the generation) |
| `save_ontology` | Validate and save generated ontology JSON to disk |
| `get_node` | Retrieve a node by ID with its description, reasoning, and connections |
| `get_chain` | Retrieve a reasoning chain with every node expanded |
| `traverse` | Walk the graph from starting nodes to a target domain |
| `check_anti_patterns` | Check a proposed design approach against prohibited patterns |
| `resolve_for_component` | Describe what you're building, get all relevant reasoning and properties |
| `search` | Free-text search across nodes, optionally filtered by domain |

## CLI

The CLI is available for scripting and CI workflows. The `init` and `update` commands require an LLM API key (Anthropic or OpenAI).

```bash
npx design-ontology init [spec-file]        # Generate ontology via LLM API
npx design-ontology validate [ontology-file] # Validate against schema
npx design-ontology update [ontology-file]   # Evolve ontology via LLM API
```

## Writing good product specs

The ontology is only as good as the spec. Include: target audience (who, expertise, constraints), core user flows, brand/tone, cultural context, accessibility needs, and what the product is NOT. See [docs/writing-specs.md](docs/writing-specs.md).

## Examples

See [`examples/ecovoorscan/`](examples/ecovoorscan/) — a complete ontology for a Dutch sustainability assessment platform (31 nodes, 8 chains, 6 anti-patterns).

## Philosophy

See [docs/philosophy.md](docs/philosophy.md) for why this exists.

## License

MIT
