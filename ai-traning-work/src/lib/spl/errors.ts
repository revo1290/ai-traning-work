export class SPLError extends Error {
  public position?: number;

  constructor(message: string, position?: number) {
    super(message);
    this.name = "SPLError";
    this.position = position;
  }
}

export class SPLSyntaxError extends SPLError {
  constructor(message: string, position: number) {
    super(`Syntax error at position ${position}: ${message}`, position);
    this.name = "SPLSyntaxError";
  }
}

export class SPLParseError extends SPLError {
  constructor(message: string, position?: number) {
    super(`Parse error: ${message}`, position);
    this.name = "SPLParseError";
  }
}

export class SPLRuntimeError extends SPLError {
  constructor(message: string) {
    super(`Runtime error: ${message}`);
    this.name = "SPLRuntimeError";
  }
}

export class SPLUnknownCommandError extends SPLError {
  constructor(command: string, position: number) {
    super(`Unknown command: ${command}`, position);
    this.name = "SPLUnknownCommandError";
  }
}
