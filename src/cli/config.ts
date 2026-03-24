import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const CONFIG_DIR = join(homedir(), ".config", "design-ontology");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  anthropic_api_key?: string;
  openai_api_key?: string;
}

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Resolve an API key from (in order): --api-key flag, env vars, saved config,
 * or interactive prompt. Returns the key and resolved provider.
 */
export async function resolveApiKey(opts: {
  apiKey?: string;
  provider: "anthropic" | "openai";
}): Promise<{ apiKey: string; provider: "anthropic" | "openai" }> {
  // 1. Explicit --api-key flag
  if (opts.apiKey) {
    return { apiKey: opts.apiKey, provider: opts.provider };
  }

  // 2. Environment variables (auto-detect provider)
  if (process.env.ANTHROPIC_API_KEY) {
    return { apiKey: process.env.ANTHROPIC_API_KEY, provider: "anthropic" };
  }
  if (process.env.OPENAI_API_KEY) {
    return { apiKey: process.env.OPENAI_API_KEY, provider: "openai" };
  }

  // 3. Saved config
  const config = loadConfig();
  if (config.anthropic_api_key) {
    return { apiKey: config.anthropic_api_key, provider: "anthropic" };
  }
  if (config.openai_api_key) {
    return { apiKey: config.openai_api_key, provider: "openai" };
  }

  // 4. Interactive prompt (only if stdin is a TTY)
  if (process.stdin.isTTY) {
    process.stderr.write(
      "\ndesign-ontology needs an LLM API key to generate ontologies.\n" +
        "You can get one from:\n" +
        "  Anthropic: https://console.anthropic.com/settings/keys\n" +
        "  OpenAI:    https://platform.openai.com/api-keys\n\n"
    );

    const providerChoice = await prompt(
      "Provider — (1) Anthropic or (2) OpenAI [1]: "
    );
    const provider =
      providerChoice === "2" ? "openai" : ("anthropic" as const);

    const apiKey = await prompt("API key: ");
    if (!apiKey) {
      process.stderr.write("No key provided.\n");
      process.exit(1);
    }

    const saveChoice = await prompt(
      `Save to ${CONFIG_FILE}? (y/N): `
    );
    if (saveChoice.toLowerCase() === "y") {
      const key =
        provider === "anthropic" ? "anthropic_api_key" : "openai_api_key";
      saveConfig({ ...config, [key]: apiKey });
      process.stderr.write(`Saved. You won't be asked again.\n\n`);
    }

    return { apiKey, provider };
  }

  // 5. Non-interactive — fail with help
  process.stderr.write(
    `\ndesign-ontology needs an LLM API key to generate ontologies.\n\n` +
      `Set one of these environment variables:\n` +
      `  export ANTHROPIC_API_KEY=<your-key>    # uses Claude\n` +
      `  export OPENAI_API_KEY=<your-key>       # uses GPT-4o\n\n` +
      `Or pass directly: --api-key <your-key>\n` +
      `Or run interactively to be prompted and save the key.\n`
  );
  process.exit(1);
}
