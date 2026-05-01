export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface ChatChunk {
  content: string;
  done: boolean;
}

export interface HealthResult {
  ok: boolean;
  version?: string;
  error?: string;
}

export interface OllamaAdapter {
  healthCheck(): Promise<HealthResult>;
  listModels(): Promise<Array<{ name: string; size?: number }>>;
  streamChat(req: ChatRequest): AsyncGenerator<ChatChunk>;
}

const OLLAMA_URL = 'http://127.0.0.1:11434';
const FETCH_TIMEOUT = 8000;

// Timeout-aware fetch
const fetchWithTimeout = (url: string, init?: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const signal = init?.signal;

  // Merge external signal with timeout signal
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export class OllamaHttpAdapter implements OllamaAdapter {
  async healthCheck(): Promise<HealthResult> {
    try {
      const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`, { method: 'GET' }, 5000);
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const json = await res.json() as { models?: Array<{ name: string }> };
      const modelCount = json.models?.length ?? 0;
      return { ok: true, version: `${modelCount} model${modelCount !== 1 ? 's' : ''} available` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg.includes('abort')) return { ok: false, error: 'Connection timed out' };
      return { ok: false, error: 'Ollama not reachable' };
    }
  }

  async listModels(): Promise<Array<{ name: string; size?: number }>> {
    try {
      const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
      if (!res.ok) return [];
      const json = await res.json() as { models?: Array<{ name: string; size?: number }> };
      return json.models ?? [];
    } catch {
      return [];
    }
  }

  async *streamChat(req: ChatRequest): AsyncGenerator<ChatChunk> {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          stream: true,
          options: { temperature: req.temperature ?? 0.7 },
        }),
        signal: req.signal,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('abort')) {
        yield { content: '', done: true };
        return;
      }
      yield { content: 'Connection lost — is Ollama running?', done: true };
      return;
    }

    if (!res.ok) {
      yield { content: res.status === 404 ? 'Model not found. Pull it first.' : `Error ${res.status}`, done: true };
      return;
    }

    if (!res.body) {
      yield { content: 'No response body', done: true };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
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
            if (parsed.message?.content) {
              yield { content: parsed.message.content, done: !!parsed.done };
            }
            if (parsed.done) {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch {
      yield { content: 'Stream interrupted', done: true };
    } finally {
      reader.releaseLock();
    }

    yield { content: '', done: true };
  }
}
