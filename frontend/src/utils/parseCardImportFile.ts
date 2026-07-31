import Papa from "papaparse";
import type { ParsedImportFile, DelimiterMode } from "../types/cardImport";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".csv", ".tsv"];

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly row?: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

function detectDelimiter(text: string, mode: DelimiterMode): "," | "\t" {
  if (mode === "comma") return ",";
  if (mode === "tab") return "\t";
  const firstLine = text.split("\n")[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new ParseError("Файл превышает 2 МБ");
  }
  const name = file.name.toLowerCase();
  const ext = SUPPORTED_EXTENSIONS.find((e) => name.endsWith(e));
  if (!ext) {
    throw new ParseError("Неподдерживаемый формат. Используйте CSV или TSV");
  }
}

export function parseCardImportFile(
  file: File,
  delimiterMode: DelimiterMode = "auto",
): Promise<ParsedImportFile> {
  return new Promise((resolve, reject) => {
    validateFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const delimiter = detectDelimiter(text, delimiterMode);

      Papa.parse<string[]>(text, {
        delimiter,
        skipEmptyLines: true,
        dynamicTyping: false,
        header: false,
        complete(result) {
          if (result.errors.length > 0) {
            const first = result.errors[0];
            reject(
              new ParseError(
                `Ошибка разбора: ${first.message}`,
                first.row ?? undefined,
              ),
            );
            return;
          }
          const parsed: ParsedImportFile = {
            headers: [],
            rows: result.data.filter(
              (row) => row.some((cell) => cell.trim() !== ""),
            ),
            delimiter,
            totalRows: result.data.length,
            fileName: file.name,
            fileSize: file.size,
          };
          resolve(parsed);
        },
        error(err: Error) {
          reject(new ParseError(`Ошибка разбора: ${err.message}`));
        },
      });
    };
    reader.onerror = () => {
      reject(new ParseError("Не удалось прочитать файл"));
    };
    reader.readAsText(file, "UTF-8");
  });
}

const HEADER_ALIASES: Record<string, "front" | "back" | "example" | "note"> = {
  front: "front",
  "лицевая сторона": "front",
  back: "back",
  "обратная сторона": "back",
  example: "example",
  пример: "example",
  note: "note",
  заметка: "note",
};

export function autoMapColumns(headers: string[]): {
  front: number | null;
  back: number | null;
  example: number | null;
  note: number | null;
} {
  const mapping: ReturnType<typeof autoMapColumns> = {
    front: null,
    back: null,
    example: null,
    note: null,
  };
  for (let i = 0; i < headers.length; i++) {
    const key = HEADER_ALIASES[headers[i].trim().toLowerCase()];
    if (key && mapping[key] === null) {
      mapping[key] = i;
    }
  }
  return mapping;
}
