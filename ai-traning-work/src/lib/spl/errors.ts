import { ErrorCode, ExecutionError } from "./types";

export class SPLError extends Error {
  public code: ErrorCode;
  public position?: number;
  public command?: string;
  public suggestion?: string;

  constructor(
    message: string,
    code: ErrorCode = "RUNTIME_ERROR",
    options?: {
      position?: number;
      command?: string;
      suggestion?: string;
    }
  ) {
    super(message);
    this.name = "SPLError";
    this.code = code;
    this.position = options?.position;
    this.command = options?.command;
    this.suggestion = options?.suggestion;
  }

  toExecutionError(): ExecutionError {
    return {
      code: this.code,
      message: this.message,
      command: this.command,
      position: this.position,
      suggestion: this.suggestion,
    };
  }
}

export class SPLSyntaxError extends SPLError {
  constructor(message: string, position: number, suggestion?: string) {
    super(`Syntax error at position ${position}: ${message}`, "SYNTAX_ERROR", {
      position,
      suggestion,
    });
    this.name = "SPLSyntaxError";
  }
}

export class SPLParseError extends SPLError {
  constructor(message: string, options?: { position?: number; command?: string; suggestion?: string }) {
    super(`Parse error: ${message}`, "PARSE_ERROR", options);
    this.name = "SPLParseError";
  }
}

export class SPLRuntimeError extends SPLError {
  constructor(message: string, command?: string, suggestion?: string) {
    super(`Runtime error: ${message}`, "RUNTIME_ERROR", { command, suggestion });
    this.name = "SPLRuntimeError";
  }
}

export class SPLUnknownCommandError extends SPLError {
  constructor(command: string, position: number) {
    const suggestions = getSimilarCommands(command);
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(", ")}?`
      : undefined;

    super(`Unknown command: ${command}`, "UNKNOWN_COMMAND", {
      position,
      command,
      suggestion: suggestionText,
    });
    this.name = "SPLUnknownCommandError";
  }
}

export class SPLUnknownFunctionError extends SPLError {
  constructor(functionName: string, command?: string) {
    const suggestions = getSimilarFunctions(functionName);
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(", ")}?`
      : undefined;

    super(`Unknown function: ${functionName}`, "UNKNOWN_FUNCTION", {
      command,
      suggestion: suggestionText,
    });
    this.name = "SPLUnknownFunctionError";
  }
}

export class SPLInvalidArgumentError extends SPLError {
  constructor(message: string, command?: string, suggestion?: string) {
    super(message, "INVALID_ARGUMENT", { command, suggestion });
    this.name = "SPLInvalidArgumentError";
  }
}

export class SPLFieldNotFoundError extends SPLError {
  constructor(fieldName: string, availableFields?: string[]) {
    const suggestion = availableFields && availableFields.length > 0
      ? `Available fields: ${availableFields.slice(0, 5).join(", ")}${availableFields.length > 5 ? "..." : ""}`
      : undefined;

    super(`Field not found: ${fieldName}`, "FIELD_NOT_FOUND", { suggestion });
    this.name = "SPLFieldNotFoundError";
  }
}

export class SPLTypeError extends SPLError {
  constructor(message: string, command?: string) {
    super(message, "TYPE_ERROR", { command });
    this.name = "SPLTypeError";
  }
}

export class SPLRegexError extends SPLError {
  constructor(pattern: string, originalError: string) {
    super(
      `Invalid regex pattern "${pattern}": ${originalError}`,
      "REGEX_ERROR",
      {
        suggestion: "Check for unescaped special characters or invalid syntax",
      }
    );
    this.name = "SPLRegexError";
  }
}

export class SPLTimeoutError extends SPLError {
  constructor(timeoutMs: number) {
    super(
      `Query execution timed out after ${timeoutMs}ms`,
      "TIMEOUT",
      {
        suggestion: "Try limiting results with 'head' or adding more specific filters",
      }
    );
    this.name = "SPLTimeoutError";
  }
}

export class SPLMemoryLimitError extends SPLError {
  constructor(limit: number) {
    super(
      `Memory limit exceeded (${limit} records)`,
      "MEMORY_LIMIT",
      {
        suggestion: "Use 'head' or 'sample' to reduce data volume, or add filters",
      }
    );
    this.name = "SPLMemoryLimitError";
  }
}

// Helper functions

const COMMON_COMMANDS = [
  "search", "where", "table", "fields", "sort", "head", "tail", "dedup",
  "stats", "eventstats", "streamstats", "top", "rare", "timechart", "chart",
  "eval", "rex", "rename", "replace", "fillnull", "lookup", "join",
  "transaction", "bin", "bucket", "makemv", "mvexpand", "spath", "regex",
  "addtotals", "reverse", "uniq", "format", "return", "inputlookup", "makeresults",
  "convert", "append"
];

const COMMON_FUNCTIONS = [
  "count", "sum", "avg", "max", "min", "dc", "values", "list",
  "first", "last", "stdev", "median", "mode", "range", "var",
  "len", "lower", "upper", "trim", "substr", "replace", "split",
  "if", "case", "coalesce", "isnull", "isnotnull", "tonumber", "tostring",
  "now", "strftime", "strptime", "relative_time",
  "abs", "ceil", "floor", "round", "sqrt", "pow", "log", "ln",
  "mvcount", "mvindex", "mvfilter", "mvjoin",
  "json_extract", "spath"
];

function getSimilarCommands(input: string): string[] {
  return findSimilar(input.toLowerCase(), COMMON_COMMANDS);
}

function getSimilarFunctions(input: string): string[] {
  return findSimilar(input.toLowerCase(), COMMON_FUNCTIONS);
}

function findSimilar(input: string, candidates: string[]): string[] {
  const results: Array<{ name: string; distance: number }> = [];

  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate);
    if (distance <= 2) {
      results.push({ name: candidate, distance });
    }
  }

  return results
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(r => r.name);
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Error message helpers
export function formatErrorForUser(error: SPLError): string {
  let message = error.message;

  if (error.command) {
    message = `[${error.command}] ${message}`;
  }

  if (error.suggestion) {
    message += `\n💡 ${error.suggestion}`;
  }

  return message;
}

export function createErrorResult(error: SPLError, executionTime: number) {
  return {
    success: false,
    data: [],
    fields: [],
    count: 0,
    executionTime,
    error: error.toExecutionError(),
  };
}
