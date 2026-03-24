import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { validateOntology } from "../core/validator.js";
import type { DesignOntology, DomainName } from "../core/types.js";
import { UPDATE_ONTOLOGY_SYSTEM_PROMPT } from "./prompts/update-ontology.js";
import { callLlm, type LlmOptions } from "./llm.js";

const DOMAIN_NAMES: DomainName[] = [
  "intents",
  "psychology",
  "culture",
  "emotions",
  "audience",
  "visual_properties",
  "accessibility",
];

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

function getNodeIds(ontology: DesignOntology): Set<string> {
  const ids = new Set<string>();
  for (const domain of DOMAIN_NAMES) {
    for (const id of Object.keys(ontology.nodes[domain] ?? {})) {
      ids.add(id);
    }
  }
  return ids;
}

function printDiff(
  oldOntology: DesignOntology,
  newOntology: DesignOntology
): void {
  const oldIds = getNodeIds(oldOntology);
  const newIds = getNodeIds(newOntology);

  const added = [...newIds].filter((id) => !oldIds.has(id));
  const removed = [...oldIds].filter((id) => !newIds.has(id));
  const kept = [...newIds].filter((id) => oldIds.has(id));

  process.stdout.write("\nChanges:\n");
  process.stdout.write(`  Nodes added: ${added.length}`);
  if (added.length > 0) process.stdout.write(` (${added.join(", ")})`);
  process.stdout.write("\n");

  process.stdout.write(`  Nodes removed: ${removed.length}`);
  if (removed.length > 0) process.stdout.write(` (${removed.join(", ")})`);
  process.stdout.write("\n");

  process.stdout.write(`  Nodes kept: ${kept.length}\n`);

  const oldChainIds = new Set(
    oldOntology.edges.reasoning_chains.map((c) => c.id)
  );
  const newChainIds = new Set(
    newOntology.edges.reasoning_chains.map((c) => c.id)
  );
  const chainsAdded = [...newChainIds].filter((id) => !oldChainIds.has(id));
  const chainsRemoved = [...oldChainIds].filter((id) => !newChainIds.has(id));

  process.stdout.write(`  Chains added: ${chainsAdded.length}\n`);
  process.stdout.write(`  Chains removed: ${chainsRemoved.length}\n`);
}

interface UpdateOptions {
  output?: string;
  change?: string;
  changeFile?: string;
  provider: "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  diff?: boolean;
  verbose?: boolean;
}

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Evolve an existing ontology based on a change description")
    .argument(
      "[ontology-file]",
      "path to existing ontology",
      "./design-ontology.json"
    )
    .option("--change <description>", "description of the change to apply")
    .option("--change-file <path>", "file containing the change description")
    .option("-o, --output <path>", "output file path (defaults to overwriting input)")
    .option("--provider <name>", "LLM provider: anthropic or openai", "anthropic")
    .option("--model <name>", "model to use")
    .option("--api-key <key>", "API key (or set env var)")
    .option("--diff", "show change summary without writing")
    .option("--verbose", "show progress and token usage")
    .action(async (ontologyFile: string, opts: UpdateOptions) => {
      // Read existing ontology
      let raw: string;
      try {
        raw = readFileSync(ontologyFile, "utf-8");
      } catch {
        process.stderr.write(`Error: Cannot read file "${ontologyFile}"\n`);
        process.exit(1);
      }

      let existing: DesignOntology;
      try {
        existing = JSON.parse(raw);
      } catch {
        process.stderr.write(`Error: "${ontologyFile}" is not valid JSON\n`);
        process.exit(1);
      }

      // Get change description
      let changeDesc: string | undefined = opts.change;
      if (!changeDesc && opts.changeFile) {
        try {
          changeDesc = readFileSync(opts.changeFile, "utf-8");
        } catch {
          process.stderr.write(
            `Error: Cannot read change file "${opts.changeFile}"\n`
          );
          process.exit(1);
        }
      }

      if (!changeDesc) {
        process.stderr.write(
          "Error: Provide --change or --change-file\n"
        );
        process.exit(1);
      }

      // Resolve API key
      const apiKey =
        opts.apiKey ??
        (opts.provider === "anthropic"
          ? process.env.ANTHROPIC_API_KEY
          : process.env.OPENAI_API_KEY);

      if (!apiKey) {
        const envVar =
          opts.provider === "anthropic"
            ? "ANTHROPIC_API_KEY"
            : "OPENAI_API_KEY";
        process.stderr.write(
          `Error: No API key provided. Pass --api-key or set ${envVar}\n`
        );
        process.exit(1);
      }

      const model =
        opts.model ??
        (opts.provider === "anthropic"
          ? "claude-sonnet-4-20250514"
          : "gpt-4o");

      const llmOpts: LlmOptions = {
        provider: opts.provider,
        model,
        apiKey,
        verbose: opts.verbose,
      };

      const userMessage = `## Current Ontology

\`\`\`json
${JSON.stringify(existing, null, 2)}
\`\`\`

## Change to Apply

${changeDesc}`;

      process.stderr.write("Updating ontology...\n");
      const response = await callLlm(
        UPDATE_ONTOLOGY_SYSTEM_PROMPT,
        userMessage,
        llmOpts
      );

      const jsonText = extractJson(response.text);
      let data: unknown;
      try {
        data = JSON.parse(jsonText);
      } catch {
        process.stderr.write("Error: LLM response is not valid JSON.\n");
        process.stderr.write(
          "Raw response:\n" + response.text.slice(0, 500) + "\n"
        );
        process.exit(1);
      }

      // Validate
      const result = validateOntology(data);
      const errors = result.errors.filter((e) => e.severity === "error");
      if (errors.length > 0) {
        process.stderr.write("Updated ontology failed validation:\n");
        for (const e of errors) {
          process.stderr.write(
            `  \x1b[31m\u2717 ${e.path}: ${e.message}\x1b[0m\n`
          );
        }
        process.exit(1);
      }

      const updated = data as DesignOntology;
      printDiff(existing, updated);

      if (opts.diff) {
        process.stderr.write("\n(--diff mode: no files written)\n");
        process.exit(0);
      }

      const outputPath = opts.output ?? ontologyFile;
      writeFileSync(outputPath, JSON.stringify(updated, null, 2) + "\n");
      process.stdout.write(`\nWritten to: ${outputPath}\n`);
    });
}
