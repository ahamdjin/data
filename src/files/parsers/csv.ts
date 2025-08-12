import { parse } from "csv-parse";

export async function* parseCsv(stream: NodeJS.ReadableStream, opts?: {
  delimiter?: string;
  encoding?: BufferEncoding;
  headers?: boolean;   // if false, create c0,c1,...
  limitRows?: number;
}) {
  const delimiter = opts?.delimiter ?? ",";
  const encoding = opts?.encoding ?? "utf8";
  const headers = opts?.headers ?? true;
  const limitRows = opts?.limitRows ?? Infinity;

  let headerRow: string[] | null = null;
  let seen = 0;

  const parser = stream.pipe(parse({ delimiter, bom: true }));

  for await (const row of parser) {
    if (!headerRow && headers) {
      headerRow = row.map((s: string) => (s ?? "").toString());
      continue;
    }
    const values: any = row;
    let obj: Record<string, any>;
    if (headers && headerRow) {
      obj = {};
      for (let i = 0; i < headerRow.length; i++) obj[headerRow[i]] = values[i];
    } else {
      obj = {};
      for (let i = 0; i < values.length; i++) obj[`c${i}`] = values[i];
    }
    yield obj;
    seen += 1;
    if (seen >= limitRows) break;
  }
}
