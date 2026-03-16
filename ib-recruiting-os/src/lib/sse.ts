export interface SSEDelta {
  text?: string;
}

export async function consumeSSE(
  stream: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (raw === "[DONE]") return;
      try {
        const parsed = JSON.parse(raw) as { delta?: SSEDelta };
        const text = parsed.delta?.text ?? "";
        if (text) onDelta(text);
      } catch {
        // ignore malformed chunks; stream may still recover next line
      }
    }
  }
}
