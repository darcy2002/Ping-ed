export class JinaError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "JinaError";
  }
}

export async function fetchMarkdown(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers: Record<string, string> = {
    Accept: "text/markdown",
  };
  if (process.env.JINA_KEY) {
    headers["Authorization"] = `Bearer ${process.env.JINA_KEY}`;
  }

  const res = await fetch(jinaUrl, { headers });
  if (!res.ok) {
    throw new JinaError(url, res.status, `Jina fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.text();
}
