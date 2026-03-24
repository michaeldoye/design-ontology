import { Command } from "commander";
import { readFileSync } from "node:fs";
import { validateOntology } from "../core/validator.js";
import type { DesignOntology, DomainName } from "../core/types.js";

const DOMAIN_NAMES: DomainName[] = [
  "intents",
  "psychology",
  "culture",
  "emotions",
  "audience",
  "visual_properties",
  "accessibility",
];

function countNodes(ontology: DesignOntology): number {
  let count = 0;
  for (const domain of DOMAIN_NAMES) {
    count += Object.keys(ontology.nodes[domain] ?? {}).length;
  }
  return count;
}

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate a design ontology file against the schema")
    .argument("[ontology-file]", "path to ontology JSON file", "./design-ontology.json")
    .option("--json", "output machine-readable JSON result")
    .option("--strict", "treat warnings as errors")
    .action(async (file: string, opts: { json?: boolean; strict?: boolean }) => {
      let raw: string;
      try {
        raw = readFileSync(file, "utf-8");
      } catch {
        process.stderr.write(`Error: Cannot read file "${file}"\n`);
        process.exit(1);
      }

      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        process.stderr.write(`Error: "${file}" is not valid JSON\n`);
        process.exit(1);
      }

      const result = validateOntology(data);

      const errors = result.errors.filter((e) => e.severity === "error");
      const warnings = result.errors.filter((e) => e.severity === "warning");

      const isValid = opts.strict
        ? errors.length === 0 && warnings.length === 0
        : errors.length === 0;

      if (opts.json) {
        const output = {
          valid: isValid,
          errors: errors.map((e) => ({ path: e.path, message: e.message })),
          warnings: warnings.map((e) => ({ path: e.path, message: e.message })),
        };
        process.stdout.write(JSON.stringify(output, null, 2) + "\n");
        process.exit(isValid ? 0 : 1);
      }

      // Formatted text output
      for (const err of errors) {
        process.stdout.write(`\x1b[31m\u2717 ${err.path}: ${err.message}\x1b[0m\n`);
      }
      for (const warn of warnings) {
        process.stdout.write(`\x1b[33m\u26A0 ${warn.path}: ${warn.message}\x1b[0m\n`);
      }

      if (isValid) {
        const ontology = data as DesignOntology;
        const nodeCount = countNodes(ontology);
        const chainCount = ontology.edges.reasoning_chains.length;
        const antiCount = Object.keys(ontology.anti_patterns ?? {}).length;
        process.stdout.write(
          `\x1b[32m\u2713 Valid design ontology: ${nodeCount} nodes, ${chainCount} chains, ${antiCount} anti-patterns\x1b[0m\n`
        );
      }

      process.exit(isValid ? 0 : 1);
    });
}
