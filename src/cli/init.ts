import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { validateOntology } from "../core/validator.js";
import type { DesignOntology, DomainName } from "../core/types.js";
import {
  GENERATE_ONTOLOGY_SYSTEM_PROMPT,
  GENERATE_ONTOLOGY_RETRY_PROMPT,
} from "./prompts/generate-ontology.js";
import { callLlm, type LlmOptions } from "./llm.js";

const SPEC_CANDIDATES = [
  "spec.md",
  "SPEC.md",
  "product-spec.md",
  "PRD.md",
  "README.md",
];

const DOMAIN_NAMES: DomainName[] = [
  "intents",
  "psychology",
  "culture",
  "emotions",
  "audience",
  "visual_properties",
  "accessibility",
];

function findSpec(): string | null {
  for (const name of SPEC_CANDIDATES) {
    if (existsSync(name)) return name;
  }
  return null;
}

function extractJson(text: string): string {
  // Strip markdown fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try to find JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

function printSummary(ontology: DesignOntology, outputPath: string): void {
  process.stdout.write("\nOntology generated successfully:\n");
  for (const domain of DOMAIN_NAMES) {
    const count = Object.keys(ontology.nodes[domain] ?? {}).length;
    process.stdout.write(`  ${domain}: ${count} nodes\n`);
  }
  process.stdout.write(
    `  reasoning_chains: ${ontology.edges.reasoning_chains.length}\n`
  );
  process.stdout.write(
    `  anti_patterns: ${Object.keys(ontology.anti_patterns ?? {}).length}\n`
  );
  process.stdout.write(`  output: ${outputPath}\n`);
}

interface InitOptions {
  output: string;
  provider: "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Generate a design ontology from a product spec")
    .argument("[spec-file]", "path to product spec (markdown)")
    .option("-o, --output <path>", "output file path", "./design-ontology.json")
    .option(
      "--provider <name>",
      "LLM provider: anthropic or openai",
      "anthropic"
    )
    .option("--model <name>", "model to use")
    .option("--api-key <key>", "API key (or set ANTHROPIC_API_KEY / OPENAI_API_KEY)")
    .option("--dry-run", "show the prompt without calling the API")
    .option("--verbose", "show progress and token usage")
    .action(async (specFile: string | undefined, opts: InitOptions) => {
      // Resolve spec file
      const resolvedSpec = specFile ?? findSpec();
      if (!resolvedSpec) {
        process.stderr.write(
          `\ndesign-ontology init generates a design ontology from your product spec.\n\n` +
            `No spec file found in the current directory.\n` +
            `Looked for: ${SPEC_CANDIDATES.join(", ")}\n\n` +
            `Either provide a path:\n` +
            `  npx design-ontology init ./path/to/spec.md\n\n` +
            `Or create a spec file in this directory. See:\n` +
            `  https://github.com/michaeldoye/design-ontology/blob/main/docs/writing-specs.md\n`
        );
        process.exit(1);
      }

      let specContent: string;
      try {
        specContent = readFileSync(resolvedSpec, "utf-8");
      } catch {
        process.stderr.write(`Error: Cannot read file "${resolvedSpec}"\n`);
        process.exit(1);
      }

      if (opts.verbose) {
        process.stderr.write(`Using spec: ${resolvedSpec}\n`);
      }

      // Dry run — print the prompt
      if (opts.dryRun) {
        process.stdout.write("=== SYSTEM PROMPT ===\n");
        process.stdout.write(GENERATE_ONTOLOGY_SYSTEM_PROMPT + "\n\n");
        process.stdout.write("=== USER MESSAGE ===\n");
        process.stdout.write(specContent + "\n");
        process.exit(0);
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
          `\ndesign-ontology init generates a design ontology from your product spec\n` +
            `by calling an LLM (${opts.provider}). An API key is required.\n\n` +
            `Provide one of:\n` +
            `  export ${envVar}=<your-key>\n` +
            `  npx design-ontology init --api-key <your-key>\n` +
            `  npx design-ontology init --provider openai   (uses OPENAI_API_KEY)\n\n` +
            `Use --dry-run to preview the prompt without calling the API.\n`
        );
        process.exit(1);
      }

      // Resolve model
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

      // First attempt
      process.stderr.write("Generating ontology...\n");
      let response = await callLlm(
        GENERATE_ONTOLOGY_SYSTEM_PROMPT,
        specContent,
        llmOpts
      );

      let jsonText = extractJson(response.text);
      let data: unknown;
      try {
        data = JSON.parse(jsonText);
      } catch {
        process.stderr.write("Error: LLM response is not valid JSON. Retrying...\n");
        response = await callLlm(
          GENERATE_ONTOLOGY_SYSTEM_PROMPT,
          specContent +
            "\n\nIMPORTANT: Your previous response was not valid JSON. Output ONLY the JSON object, no markdown or explanation.",
          llmOpts
        );
        jsonText = extractJson(response.text);
        try {
          data = JSON.parse(jsonText);
        } catch {
          process.stderr.write("Error: Retry also failed to produce valid JSON.\n");
          process.stderr.write("Raw response:\n" + response.text.slice(0, 500) + "\n");
          process.exit(1);
        }
      }

      // Validate
      let result = validateOntology(data);
      const errors = result.errors.filter((e) => e.severity === "error");

      if (errors.length > 0) {
        process.stderr.write(
          `Validation failed (${errors.length} errors). Retrying with error feedback...\n`
        );

        const errorText = errors
          .map((e) => `- ${e.path}: ${e.message}`)
          .join("\n");

        response = await callLlm(
          GENERATE_ONTOLOGY_SYSTEM_PROMPT,
          GENERATE_ONTOLOGY_RETRY_PROMPT +
            errorText +
            "\n\nORIGINAL SPEC:\n" +
            specContent,
          llmOpts
        );

        jsonText = extractJson(response.text);
        try {
          data = JSON.parse(jsonText);
        } catch {
          process.stderr.write("Error: Retry response is not valid JSON.\n");
          process.exit(1);
        }

        result = validateOntology(data);
        const retryErrors = result.errors.filter((e) => e.severity === "error");
        if (retryErrors.length > 0) {
          process.stderr.write("Validation still failing after retry:\n");
          for (const e of retryErrors) {
            process.stderr.write(`  \x1b[31m\u2717 ${e.path}: ${e.message}\x1b[0m\n`);
          }
          process.exit(1);
        }
      }

      // Write output
      const ontology = data as DesignOntology;
      writeFileSync(opts.output, JSON.stringify(ontology, null, 2) + "\n");
      printSummary(ontology, opts.output);
    });
}
