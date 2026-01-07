import { Token, TokenType, KEYWORDS, OPERATORS } from "./types";
import { SPLSyntaxError } from "./errors";

export class SPLLexer {
  private input: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    this.tokens.push({
      type: "EOF",
      value: "",
      position: this.position,
    });

    return this.tokens;
  }

  private nextToken(): Token | null {
    const char = this.current();

    // Pipe
    if (char === "|") {
      return this.makeToken("PIPE", "|");
    }

    // Comma
    if (char === ",") {
      return this.makeToken("COMMA", ",");
    }

    // Parentheses
    if (char === "(") {
      return this.makeToken("LPAREN", "(");
    }
    if (char === ")") {
      return this.makeToken("RPAREN", ")");
    }

    // Brackets
    if (char === "[") {
      return this.makeToken("LBRACKET", "[");
    }
    if (char === "]") {
      return this.makeToken("RBRACKET", "]");
    }

    // Dot
    if (char === ".") {
      return this.makeToken("DOT", ".");
    }

    // Comparison operators
    if (char === "=" || char === "!" || char === ">" || char === "<") {
      return this.readOperator();
    }

    // String
    if (char === '"' || char === "'") {
      return this.readString();
    }

    // Number (including negative)
    if (this.isDigit(char) || (char === "-" && this.isDigit(this.peek(1)))) {
      return this.readNumber();
    }

    // Wildcard
    if (char === "*") {
      return this.makeToken("WILDCARD", "*");
    }

    // Identifier or Keyword
    if (this.isAlpha(char) || char === "_") {
      return this.readIdentifier();
    }

    throw new SPLSyntaxError(`Unexpected character: ${char}`, this.position);
  }

  private readOperator(): Token {
    const startPos = this.position;
    const char = this.current();

    if (char === "=") {
      this.advance();
      return { type: "EQUALS", value: "=", position: startPos };
    }

    if (char === "!") {
      this.advance();
      if (this.current() === "=") {
        this.advance();
        return { type: "NOT_EQUALS", value: "!=", position: startPos };
      }
      throw new SPLSyntaxError("Expected '=' after '!'", this.position);
    }

    if (char === ">") {
      this.advance();
      if (this.current() === "=") {
        this.advance();
        return { type: "GREATER_EQ", value: ">=", position: startPos };
      }
      return { type: "GREATER", value: ">", position: startPos };
    }

    if (char === "<") {
      this.advance();
      if (this.current() === "=") {
        this.advance();
        return { type: "LESS_EQ", value: "<=", position: startPos };
      }
      return { type: "LESS", value: "<", position: startPos };
    }

    throw new SPLSyntaxError(`Unexpected operator: ${char}`, this.position);
  }

  private readString(): Token {
    const startPos = this.position;
    const quote = this.current();
    this.advance();

    let value = "";
    while (this.position < this.input.length && this.current() !== quote) {
      if (this.current() === "\\") {
        this.advance();
        if (this.position < this.input.length) {
          value += this.current();
          this.advance();
        }
      } else {
        value += this.current();
        this.advance();
      }
    }

    if (this.current() !== quote) {
      throw new SPLSyntaxError("Unterminated string", startPos);
    }

    this.advance();
    return { type: "STRING", value, position: startPos };
  }

  private readNumber(): Token {
    const startPos = this.position;
    let value = "";

    if (this.current() === "-") {
      value += "-";
      this.advance();
    }

    while (this.position < this.input.length && this.isDigit(this.current())) {
      value += this.current();
      this.advance();
    }

    if (this.current() === "." && this.isDigit(this.peek(1))) {
      value += ".";
      this.advance();
      while (this.position < this.input.length && this.isDigit(this.current())) {
        value += this.current();
        this.advance();
      }
    }

    return { type: "NUMBER", value, position: startPos };
  }

  private readIdentifier(): Token {
    const startPos = this.position;
    let value = "";

    while (
      this.position < this.input.length &&
      (this.isAlphaNumeric(this.current()) || this.current() === "_" || this.current() === "-")
    ) {
      value += this.current();
      this.advance();
    }

    const upperValue = value.toUpperCase();

    // Check if it's a keyword
    if (KEYWORDS.includes(value.toLowerCase() as (typeof KEYWORDS)[number])) {
      return { type: "KEYWORD", value: value.toLowerCase(), position: startPos };
    }

    // Check if it's an operator
    if (OPERATORS.includes(upperValue as (typeof OPERATORS)[number])) {
      return { type: "OPERATOR", value: upperValue, position: startPos };
    }

    return { type: "IDENTIFIER", value, position: startPos };
  }

  private makeToken(type: TokenType, value: string): Token {
    const token = { type, value, position: this.position };
    this.advance();
    return token;
  }

  private current(): string {
    return this.input[this.position] || "";
  }

  private peek(offset: number = 1): string {
    return this.input[this.position + offset] || "";
  }

  private advance(): void {
    this.position++;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.current())) {
      this.advance();
    }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }
}
