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
  if (opts.provider === "anthropic") {
    return callAnthropic(systemPrompt, userMessage, opts);
  }
  return callOpenAI(systemPrompt, userMessage, opts);
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
