export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatChunk {
  content: string;
  done: boolean;
}

export interface OllamaAdapter {
  healthCheck(): Promise<{ ok: boolean }>;
  listModels(): Promise<Array<{ name: string }>>;
  streamChat(req: ChatRequest): AsyncGenerator<ChatChunk>;
}

const OLLAMA_URL = 'http://127.0.0.1:11434';

export class OllamaHttpAdapter implements OllamaAdapter {
  async healthCheck(): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }

  async listModels(): Promise<Array<{ name: string }>> {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    if (!res.ok) return [];
    const json = (await res.json()) as { models?: Array<{ name: string }> };
    return json.models ?? [];
  }

  async *streamChat(req: ChatRequest): AsyncGenerator<ChatChunk> {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: req.model, messages: req.messages, stream: true, options: { temperature: req.temperature ?? 0.7 } }),
    });

    if (!res.ok || !res.body) {
      yield { content: 'Error', done: true };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { done?: boolean; message?: { content?: string } };
          yield { content: parsed.message?.content ?? '', done: !!parsed.done };
        } catch {
          // ignore malformed line
        }
      }
    }

    yield { content: '', done: true };
  }
}
