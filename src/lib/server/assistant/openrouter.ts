import { z } from 'zod';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

/** A chat message in the OpenAI-compatible shape OpenRouter expects. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  /** Present on role:'tool' — the id of the call being answered. */
  tool_call_id?: string;
  name?: string;
}

export interface ChatTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments. */
  parameters: Record<string, unknown>;
}

/**
 * The one capability the assistant loop needs: send the running transcript plus
 * the tool catalogue, get back the model's next message. Abstracted so the loop
 * is testable without hitting the network.
 */
export interface LlmClient {
  complete(messages: ChatMessage[], tools: ChatTool[]): Promise<ChatMessage>;
}

const responseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          role: z.literal('assistant'),
          content: z.string().nullable().default(null),
          tool_calls: z
            .array(
              z.object({
                id: z.string(),
                function: z.object({ name: z.string(), arguments: z.string() }),
              }),
            )
            .optional(),
        }),
      }),
    )
    .min(1),
});

function toApiMessage(message: ChatMessage): Record<string, unknown> {
  const base: Record<string, unknown> = { role: message.role, content: message.content };
  if (message.tool_calls !== undefined) {
    base.tool_calls = message.tool_calls.map((call) => ({
      id: call.id,
      type: 'function',
      function: { name: call.name, arguments: call.arguments },
    }));
  }
  if (message.tool_call_id !== undefined) base.tool_call_id = message.tool_call_id;
  if (message.name !== undefined) base.name = message.name;
  return base;
}

function toApiTool(tool: ChatTool): Record<string, unknown> {
  return {
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  };
}

/** Parse OpenRouter's completion payload into our ChatMessage. Exported for tests. */
export function parseCompletion(raw: unknown): ChatMessage {
  const { choices } = responseSchema.parse(raw);
  const message = choices[0]?.message;
  if (message === undefined) throw new Error('OpenRouter returned no message');
  return {
    role: 'assistant',
    content: message.content,
    tool_calls: message.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: call.function.arguments,
    })),
  };
}

export class OpenRouterClient implements LlmClient {
  readonly #apiKey: string;
  readonly #model: string;

  constructor(apiKey: string, model: string) {
    this.#apiKey = apiKey;
    this.#model = model;
  }

  async complete(messages: ChatMessage[], tools: ChatTool[]): Promise<ChatMessage> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.#apiKey}`,
        'content-type': 'application/json',
        // Optional attribution headers OpenRouter recommends.
        'x-title': 'Jetstream',
      },
      body: JSON.stringify({
        model: this.#model,
        messages: messages.map(toApiMessage),
        tools: tools.map(toApiTool),
        tool_choice: 'auto',
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `OpenRouter request failed: ${response.status} ${response.statusText} ${detail}`.trim(),
      );
    }
    return parseCompletion(await response.json());
  }
}

/** Check an API key + model by asking for a trivial completion. For Settings. */
export async function verifyOpenRouter(
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await new OpenRouterClient(apiKey, model).complete(
      [{ role: 'user', content: 'Reply with the single word: ok' }],
      [],
    );
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Verification failed' };
  }
}
