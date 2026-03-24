# MCP Server Setup Guide

The **design-ontology** MCP (Model Context Protocol) server loads a design ontology JSON file and exposes queryable tools to AI coding agents. This guide covers installation and configuration for all supported IDEs.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_node` | Retrieve a node by ID with its full description, reasoning, connections, and chain membership. |
| `get_chain` | Retrieve a reasoning chain by ID or name, with every node in the path expanded. |
| `traverse` | Traverse from starting nodes to a target domain (e.g., visual_properties), returning all paths and reasoning. |
| `check_anti_patterns` | Check a proposed design approach against the ontology's anti-patterns. |
| `resolve_for_component` | The primary tool: describe what you're building, get all relevant reasoning, visual properties, and warnings. |
| `search` | Search the ontology by keyword or concept, optionally filtered by domain. |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ONTOLOGY_PATH` | Yes | Path to your `design-ontology.json` file. Relative paths are resolved from the project root. |

---

## IDE Setup

### Claude Code

Claude Code supports both a project-scoped config file and a CLI command for registering MCP servers.

#### Option A: Project config file

Create a `.mcp.json` file at your project root:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "-p", "design-ontology", "design-ontology-mcp"]
    }
  }
}
```

#### Option B: CLI command

```bash
claude mcp add design-ontology -- npx -y -p design-ontology design-ontology-mcp
```

When using the CLI command, set the `ONTOLOGY_PATH` environment variable in your shell or `.env` file before starting Claude Code.

#### Verification

1. Start a Claude Code session in your project directory.
2. The MCP server should initialize automatically. Look for a confirmation that the `design-ontology` server connected successfully.
3. Run the test prompt from the [Verify Your Setup](#verify-your-setup) section below.

#### Troubleshooting

- **Server not starting** -- Ensure `npx` is available on your `PATH`. Run `npx -y design-ontology` manually in your terminal to confirm the package resolves.
- **File not found** -- Verify that `design-ontology.json` exists at the path specified by `ONTOLOGY_PATH`. The path is resolved relative to the project root.
- **Wrong path** -- Use `./` prefix for relative paths. Absolute paths (e.g., `/Users/you/project/design-ontology.json`) also work.

---

### Cursor

Create a `.cursor/mcp.json` file in your project:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "-p", "design-ontology", "design-ontology-mcp"]
    }
  }
}
```

#### Verification

1. Open your project in Cursor.
2. Open the Cursor settings and navigate to the MCP section to confirm the `design-ontology` server appears and shows a green/active status.
3. Run the test prompt from the [Verify Your Setup](#verify-your-setup) section below.

#### Troubleshooting

- **Server not starting** -- Make sure you have Node.js installed and `npx` is accessible. Restart Cursor after adding the config file.
- **File not found** -- Check that `design-ontology.json` is in your project root or adjust `ONTOLOGY_PATH` accordingly.
- **Wrong path** -- Relative paths in `.cursor/mcp.json` are resolved from the project root, not from the `.cursor/` directory.

---

### Windsurf

Configure the MCP server through Windsurf settings:

1. Open Windsurf settings.
2. Navigate to **Cascade > MCP**.
3. Add a new MCP server with the following configuration:

```json
{
  "mcpServers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "-p", "design-ontology", "design-ontology-mcp"]
    }
  }
}
```

#### Verification

1. After saving the configuration, restart Cascade or reload the Windsurf window.
2. Confirm the `design-ontology` server appears as connected in the MCP section of settings.
3. Run the test prompt from the [Verify Your Setup](#verify-your-setup) section below.

#### Troubleshooting

- **Server not starting** -- Verify that `npx` is available in the shell environment Windsurf uses. You may need to configure the Node.js path in Windsurf settings.
- **File not found** -- Ensure `ONTOLOGY_PATH` points to the correct location of your ontology file. Try using an absolute path if relative paths are not resolving.
- **Wrong path** -- Paths are resolved relative to the workspace root open in Windsurf.

---

### VS Code (Copilot)

Create a `.vscode/mcp.json` file in your project:

```json
{
  "servers": {
    "design-ontology": {
      "command": "npx",
      "args": ["-y", "-p", "design-ontology", "design-ontology-mcp"]
    }
  }
}
```

> **Note:** VS Code uses a `"servers"` key (not `"mcpServers"`) in its MCP configuration.

#### Verification

1. Open your project in VS Code.
2. Open the Copilot chat panel. The MCP server should start automatically when Copilot initializes.
3. Check the Output panel (select "MCP" from the dropdown) to confirm the server started without errors.
4. Run the test prompt from the [Verify Your Setup](#verify-your-setup) section below.

#### Troubleshooting

- **Server not starting** -- Make sure you are using a version of VS Code that supports MCP servers in Copilot. Check the Output panel for error messages.
- **File not found** -- Confirm that `design-ontology.json` is present at the path specified. The path resolves from the workspace root.
- **Wrong path** -- The `.vscode/mcp.json` paths resolve relative to the workspace folder, not the `.vscode/` directory itself.

---

## Verify Your Setup

Once your MCP server is configured, test it by sending the following prompt to your AI coding agent:

> **Using the design ontology, what visual properties apply to the core risk assessment intent?**

A successful response will:

- Invoke one or more of the design-ontology tools (such as `getIntent` or `searchOntology`).
- Return structured information about visual properties associated with risk assessment, including relevant tokens, color values, typography, and usage guidelines.

If the agent does not call any design-ontology tools, or if it responds that it has no access to the ontology, revisit the configuration steps for your IDE above.
