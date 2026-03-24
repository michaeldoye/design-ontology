export interface LlmOptions {
  provider: "anthropic" | "openai";
  model: string;
  apiKey: string;
  verbose?: boolean;
}

export interface LlmResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export async function callLlm(
  systemPrompt: string,
  userMessage: string,
  opts: LlmOptions
): Promise<LlmResponse> {
  try {
    if (opts.provider === "anthropic") {
      return await callAnthropic(systemPrompt, userMessage, opts);
    }
    return await callOpenAI(systemPrompt, userMessage, opts);
  } catch (err: unknown) {
    handleApiError(err, opts.provider);
  }
}

function handleApiError(err: unknown, provider: string): never {
  const error = err as Record<string, unknown>;

  // Extract the human-readable message from SDK errors
  let message = "";
  if (error.error && typeof error.error === "object") {
    const inner = error.error as Record<string, unknown>;
    if (inner.error && typeof inner.error === "object") {
      // Anthropic: { error: { error: { message: "..." } } }
      message = (inner.error as Record<string, unknown>).message as string;
    } else if (inner.message) {
      message = inner.message as string;
    }
  }
  if (!message && error.message) {
    message = error.message as string;
  }

  const status = error.status as number | undefined;

  // Provide actionable guidance for common errors
  if (status === 400 && message.includes("credit balance")) {
    process.stderr.write(
      `\nError: ${provider} API credit balance is too low.\n\n` +
        `Note: A Claude Pro subscription (claude.ai) is separate from the\n` +
        `Anthropic API (console.anthropic.com). The API requires its own credits.\n\n` +
        `  Anthropic: https://console.anthropic.com/settings/billing\n` +
        `  OpenAI:    https://platform.openai.com/settings/organization/billing\n\n` +
        `Or switch providers:\n` +
        `  npx design-ontology init --provider openai\n`
    );
  } else if (status === 401) {
    process.stderr.write(
      `\nError: Invalid ${provider} API key.\n\n` +
        `Check your key and try again. You can reset it with:\n` +
        `  npx design-ontology init --api-key <new-key>\n`
    );
  } else if (status === 429) {
    process.stderr.write(
      `\nError: ${provider} API rate limit exceeded.\n\n` +
        `Wait a moment and try again, or check your usage limits:\n` +
        `  Anthropic: https://console.anthropic.com/settings/limits\n` +
        `  OpenAI:    https://platform.openai.com/settings/organization/limits\n`
    );
  } else if (message) {
    process.stderr.write(`\nError from ${provider} API: ${message}\n`);
  } else {
    process.stderr.write(
      `\nError: ${provider} API request failed (${status ?? "unknown"}).\n`
    );
  }

  process.exit(1);
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  opts: LlmOptions
): Promise<LlmResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: opts.apiKey });

  if (opts.verbose) {
    process.stderr.write(`Calling Anthropic (${opts.model})...\n`);
  }

  const response = await client.messages.create({
    model: opts.model,
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  if (opts.verbose) {
    process.stderr.write(
      `Tokens: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output\n`
    );
  }

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  opts: LlmOptions
): Promise<LlmResponse> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: opts.apiKey });

  if (opts.verbose) {
    process.stderr.write(`Calling OpenAI (${opts.model})...\n`);
  }

  const response = await client.chat.completions.create({
    model: opts.model,
    max_tokens: 16384,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  if (opts.verbose && response.usage) {
    process.stderr.write(
      `Tokens: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output\n`
    );
  }

  return {
    text,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}
