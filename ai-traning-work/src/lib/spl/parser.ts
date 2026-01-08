import {
  Token,
  SPLQuery,
  Command,
  SearchCommand,
  SearchCondition,
  WhereCommand,
  Expression,
  TableCommand,
  SortCommand,
  HeadCommand,
  TailCommand,
  DedupCommand,
  FieldsCommand,
  StatsCommand,
  Aggregation,
  TopCommand,
  RareCommand,
  TimechartCommand,
  EvalCommand,
  RexCommand,
  RenameCommand,
  LookupCommand,
  STATS_FUNCTIONS,
  StatsFunction,
} from "./types";
import { SPLParseError, SPLUnknownCommandError } from "./errors";

export class SPLParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): SPLQuery {
    const commands: Command[] = [];

    while (!this.isAtEnd()) {
      const command = this.parseCommand();
      if (command) {
        commands.push(command);
      }

      // Skip pipe if present
      if (this.check("PIPE")) {
        this.advance();
      }
    }

    return { commands };
  }

  private parseCommand(): Command | null {
    const token = this.peek();

    if (token.type === "EOF") {
      return null;
    }

    if (token.type === "KEYWORD") {
      switch (token.value) {
        case "search":
          return this.parseSearch();
        case "where":
          return this.parseWhere();
        case "table":
          return this.parseTable();
        case "sort":
          return this.parseSort();
        case "head":
          return this.parseHead();
        case "tail":
          return this.parseTail();
        case "dedup":
          return this.parseDedup();
        case "fields":
          return this.parseFields();
        case "stats":
          return this.parseStats();
        case "top":
          return this.parseTop();
        case "rare":
          return this.parseRare();
        case "timechart":
          return this.parseTimechart();
        case "eval":
          return this.parseEval();
        case "rex":
          return this.parseRex();
        case "rename":
          return this.parseRename();
        case "lookup":
          return this.parseLookup();
        default:
          throw new SPLUnknownCommandError(token.value, token.position);
      }
    }

    // Implicit search
    return this.parseImplicitSearch();
  }

  private parseSearch(): SearchCommand {
    this.advance(); // consume 'search'
    return this.parseImplicitSearch();
  }

  private parseImplicitSearch(): SearchCommand {
    const conditions: SearchCondition[] = [];

    while (!this.isAtEnd() && !this.check("PIPE")) {
      const condition = this.parseSearchCondition();
      if (condition) {
        conditions.push(condition);
      }

      // Check for logical operators
      if (this.check("OPERATOR") && (this.peek().value === "AND" || this.peek().value === "OR")) {
        const logicalOp = this.peek().value as "AND" | "OR";
        this.advance();
        if (conditions.length > 0) {
          conditions[conditions.length - 1].logicalOp = logicalOp;
        }
      }
    }

    return { type: "search", conditions };
  }

  private parseSearchCondition(): SearchCondition | null {
    let isNegated = false;

    // Check for NOT
    if (this.check("OPERATOR") && this.peek().value === "NOT") {
      isNegated = true;
      this.advance();
    }

    const token = this.peek();

    // Field=value pattern
    if (token.type === "IDENTIFIER") {
      const field = token.value;
      this.advance();

      if (this.check("EQUALS") || this.check("NOT_EQUALS") ||
          this.check("GREATER") || this.check("GREATER_EQ") ||
          this.check("LESS") || this.check("LESS_EQ")) {
        const op = this.peek().value as SearchCondition["operator"];
        this.advance();

        const valueToken = this.peek();
        let value: string;
        if (valueToken.type === "STRING" || valueToken.type === "NUMBER" ||
            valueToken.type === "IDENTIFIER" || valueToken.type === "WILDCARD") {
          value = valueToken.value;
          this.advance();
        } else {
          throw new SPLParseError(`Expected value after operator`, { position: valueToken.position });
        }

        return { field, operator: op === "!=" ? "!=" : op as SearchCondition["operator"], value, isNegated };
      }

      // Just a keyword search
      return { value: field, operator: "=", isNegated };
    }

    // String value
    if (token.type === "STRING") {
      this.advance();
      return { value: token.value, operator: "=", isNegated };
    }

    // Wildcard
    if (token.type === "WILDCARD") {
      this.advance();
      return { value: "*", operator: "=", isNegated };
    }

    return null;
  }

  private parseWhere(): WhereCommand {
    this.advance(); // consume 'where'
    const expression = this.parseExpression();
    return { type: "where", expression };
  }

  private parseExpression(): Expression {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalAnd();

    while (this.check("OPERATOR") && this.peek().value === "OR") {
      this.advance();
      const right = this.parseLogicalAnd();
      left = { type: "logical", operator: "OR", left, right };
    }

    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseComparison();

    while (this.check("OPERATOR") && this.peek().value === "AND") {
      this.advance();
      const right = this.parseComparison();
      left = { type: "logical", operator: "AND", left, right };
    }

    return left;
  }

  private parseComparison(): Expression {
    const left = this.parsePrimary();

    if (this.check("EQUALS") || this.check("NOT_EQUALS") ||
        this.check("GREATER") || this.check("GREATER_EQ") ||
        this.check("LESS") || this.check("LESS_EQ")) {
      const operator = this.peek().value;
      this.advance();
      const right = this.parsePrimary();
      return { type: "comparison", operator, left, right };
    }

    // LIKE operator
    if (this.check("OPERATOR") && this.peek().value === "LIKE") {
      this.advance();
      const right = this.parsePrimary();
      return { type: "comparison", operator: "LIKE", left, right };
    }

    // IN operator
    if (this.check("OPERATOR") && this.peek().value === "IN") {
      this.advance();
      if (!this.check("LPAREN")) {
        throw new SPLParseError("Expected '(' after IN", { position: this.peek().position });
      }
      this.advance();
      const values: Expression[] = [];
      while (!this.check("RPAREN") && !this.isAtEnd()) {
        values.push(this.parsePrimary());
        if (this.check("COMMA")) {
          this.advance();
        }
      }
      if (!this.check("RPAREN")) {
        throw new SPLParseError("Expected ')' after IN values", { position: this.peek().position });
      }
      this.advance();
      return { type: "comparison", operator: "IN", left, right: { type: "literal", value: values } as unknown as Expression };
    }

    return left;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    if (token.type === "NUMBER") {
      this.advance();
      return { type: "literal", value: parseFloat(token.value) };
    }

    if (token.type === "STRING") {
      this.advance();
      return { type: "literal", value: token.value };
    }

    if (token.type === "IDENTIFIER") {
      const name = token.value;
      this.advance();

      // Check for function call
      if (this.check("LPAREN")) {
        this.advance();
        const args: Expression[] = [];
        while (!this.check("RPAREN") && !this.isAtEnd()) {
          args.push(this.parseExpression());
          if (this.check("COMMA")) {
            this.advance();
          }
        }
        if (!this.check("RPAREN")) {
          throw new SPLParseError("Expected ')'", { position: this.peek().position });
        }
        this.advance();
        return { type: "function", name, args };
      }

      return { type: "field", name };
    }

    if (token.type === "LPAREN") {
      this.advance();
      const expr = this.parseExpression();
      if (!this.check("RPAREN")) {
        throw new SPLParseError("Expected ')'", { position: this.peek().position });
      }
      this.advance();
      return expr;
    }

    throw new SPLParseError(`Unexpected token: ${token.value}`, { position: token.position });
  }

  private parseTable(): TableCommand {
    this.advance(); // consume 'table'
    const fields: string[] = [];

    while (!this.isAtEnd() && !this.check("PIPE")) {
      if (this.check("IDENTIFIER") || this.check("WILDCARD")) {
        fields.push(this.peek().value);
        this.advance();
      }
      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "table", fields };
  }

  private parseSort(): SortCommand {
    this.advance(); // consume 'sort'
    const fields: Array<{ field: string; direction: "asc" | "desc" }> = [];

    while (!this.isAtEnd() && !this.check("PIPE")) {
      let direction: "asc" | "desc" = "asc";
      let field: string;

      // Check for - or + prefix
      if (this.check("IDENTIFIER")) {
        const value = this.peek().value;
        if (value.startsWith("-")) {
          direction = "desc";
          field = value.substring(1);
        } else if (value.startsWith("+")) {
          field = value.substring(1);
        } else {
          field = value;
        }
        this.advance();
        fields.push({ field, direction });
      }

      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "sort", fields };
  }

  private parseHead(): HeadCommand {
    this.advance(); // consume 'head'
    let count = 10;

    if (this.check("NUMBER")) {
      count = parseInt(this.peek().value);
      this.advance();
    }

    return { type: "head", count };
  }

  private parseTail(): TailCommand {
    this.advance(); // consume 'tail'
    let count = 10;

    if (this.check("NUMBER")) {
      count = parseInt(this.peek().value);
      this.advance();
    }

    return { type: "tail", count };
  }

  private parseDedup(): DedupCommand {
    this.advance(); // consume 'dedup'
    const fields: string[] = [];

    while (!this.isAtEnd() && !this.check("PIPE") && this.check("IDENTIFIER")) {
      fields.push(this.peek().value);
      this.advance();
      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "dedup", fields };
  }

  private parseFields(): FieldsCommand {
    this.advance(); // consume 'fields'
    let mode: "include" | "exclude" = "include";
    const fields: string[] = [];

    // Check for +/- prefix
    if (this.check("IDENTIFIER")) {
      const first = this.peek().value;
      if (first === "+" || first === "-") {
        mode = first === "-" ? "exclude" : "include";
        this.advance();
      }
    }

    while (!this.isAtEnd() && !this.check("PIPE")) {
      if (this.check("IDENTIFIER") || this.check("WILDCARD")) {
        fields.push(this.peek().value);
        this.advance();
      }
      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "fields", mode, fields };
  }

  private parseStats(): StatsCommand {
    this.advance(); // consume 'stats'
    const aggregations: Aggregation[] = [];
    const groupBy: string[] = [];

    while (!this.isAtEnd() && !this.check("PIPE")) {
      // Check for BY clause
      if (this.check("OPERATOR") && this.peek().value === "BY") {
        this.advance();
        while (!this.isAtEnd() && !this.check("PIPE") && this.check("IDENTIFIER")) {
          groupBy.push(this.peek().value);
          this.advance();
          if (this.check("COMMA")) {
            this.advance();
          }
        }
        break;
      }

      // Parse aggregation function
      if (this.check("IDENTIFIER")) {
        const funcName = this.peek().value.toLowerCase();
        if (STATS_FUNCTIONS.includes(funcName as StatsFunction)) {
          this.advance();
          const agg: Aggregation = { function: funcName as StatsFunction };

          // Check for (field)
          if (this.check("LPAREN")) {
            this.advance();
            if (this.check("IDENTIFIER") || this.check("WILDCARD")) {
              agg.field = this.peek().value;
              this.advance();
            }
            if (!this.check("RPAREN")) {
              throw new SPLParseError("Expected ')'", { position: this.peek().position });
            }
            this.advance();
          }

          // Check for AS alias
          if (this.check("OPERATOR") && this.peek().value === "AS") {
            this.advance();
            if (this.check("IDENTIFIER")) {
              agg.alias = this.peek().value;
              this.advance();
            }
          }

          aggregations.push(agg);
        }
      }

      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "stats", aggregations, groupBy };
  }

  private parseTop(): TopCommand {
    this.advance(); // consume 'top'
    let count = 10;

    if (this.check("NUMBER")) {
      count = parseInt(this.peek().value);
      this.advance();
    }

    if (!this.check("IDENTIFIER")) {
      throw new SPLParseError("Expected field name for top command", { position: this.peek().position });
    }

    const field = this.peek().value;
    this.advance();

    return { type: "top", count, field };
  }

  private parseRare(): RareCommand {
    this.advance(); // consume 'rare'
    let count = 10;

    if (this.check("NUMBER")) {
      count = parseInt(this.peek().value);
      this.advance();
    }

    if (!this.check("IDENTIFIER")) {
      throw new SPLParseError("Expected field name for rare command", { position: this.peek().position });
    }

    const field = this.peek().value;
    this.advance();

    return { type: "rare", count, field };
  }

  private parseTimechart(): TimechartCommand {
    this.advance(); // consume 'timechart'
    let span = "1h";
    const aggregations: Aggregation[] = [];
    let splitBy: string | undefined;

    while (!this.isAtEnd() && !this.check("PIPE")) {
      // Parse span=value
      if (this.check("IDENTIFIER") && this.peek().value === "span") {
        this.advance();
        if (this.check("EQUALS")) {
          this.advance();
          if (this.check("IDENTIFIER") || this.check("NUMBER")) {
            span = this.peek().value;
            this.advance();
          }
        }
        continue;
      }

      // Parse BY clause
      if (this.check("OPERATOR") && this.peek().value === "BY") {
        this.advance();
        if (this.check("IDENTIFIER")) {
          splitBy = this.peek().value;
          this.advance();
        }
        continue;
      }

      // Parse aggregation
      if (this.check("IDENTIFIER")) {
        const funcName = this.peek().value.toLowerCase();
        if (STATS_FUNCTIONS.includes(funcName as StatsFunction)) {
          this.advance();
          const agg: Aggregation = { function: funcName as StatsFunction };

          if (this.check("LPAREN")) {
            this.advance();
            if (this.check("IDENTIFIER")) {
              agg.field = this.peek().value;
              this.advance();
            }
            if (this.check("RPAREN")) {
              this.advance();
            }
          }

          aggregations.push(agg);
        }
      }
    }

    return { type: "timechart", span, aggregations, splitBy };
  }

  private parseEval(): EvalCommand {
    this.advance(); // consume 'eval'

    if (!this.check("IDENTIFIER")) {
      throw new SPLParseError("Expected field name for eval", { position: this.peek().position });
    }

    const field = this.peek().value;
    this.advance();

    if (!this.check("EQUALS")) {
      throw new SPLParseError("Expected '=' in eval", { position: this.peek().position });
    }
    this.advance();

    const expression = this.parseExpression();

    return { type: "eval", field, expression };
  }

  private parseRex(): RexCommand {
    this.advance(); // consume 'rex'
    let field = "_raw";

    // Parse field=xxx
    if (this.check("IDENTIFIER") && this.peek().value === "field") {
      this.advance();
      if (this.check("EQUALS")) {
        this.advance();
        if (this.check("IDENTIFIER")) {
          field = this.peek().value;
          this.advance();
        }
      }
    }

    // Parse pattern
    if (!this.check("STRING")) {
      throw new SPLParseError("Expected pattern string for rex", { position: this.peek().position });
    }

    const pattern = this.peek().value;
    this.advance();

    return { type: "rex", field, pattern };
  }

  private parseRename(): RenameCommand {
    this.advance(); // consume 'rename'
    const renames: Array<{ from: string; to: string }> = [];

    while (!this.isAtEnd() && !this.check("PIPE")) {
      if (this.check("IDENTIFIER")) {
        const from = this.peek().value;
        this.advance();

        if (this.check("OPERATOR") && this.peek().value === "AS") {
          this.advance();
          if (this.check("IDENTIFIER")) {
            const to = this.peek().value;
            this.advance();
            renames.push({ from, to });
          }
        }
      }

      if (this.check("COMMA")) {
        this.advance();
      }
    }

    return { type: "rename", renames };
  }

  private parseLookup(): LookupCommand {
    this.advance(); // consume 'lookup'

    if (!this.check("IDENTIFIER")) {
      throw new SPLParseError("Expected lookup table name", { position: this.peek().position });
    }

    const table = this.peek().value;
    this.advance();

    if (!this.check("IDENTIFIER")) {
      throw new SPLParseError("Expected lookup field", { position: this.peek().position });
    }

    const field = this.peek().value;
    this.advance();

    const outputFields: string[] = [];

    // Parse OUTPUT fields
    if (this.check("IDENTIFIER") && this.peek().value.toUpperCase() === "OUTPUT") {
      this.advance();
      while (!this.isAtEnd() && !this.check("PIPE") && this.check("IDENTIFIER")) {
        outputFields.push(this.peek().value);
        this.advance();
        if (this.check("COMMA")) {
          this.advance();
        }
      }
    }

    return { type: "lookup", table, field, outputFields };
  }

  // Helper methods
  private peek(): Token {
    return this.tokens[this.position] || { type: "EOF", value: "", position: -1 };
  }

  private advance(): Token {
    const token = this.peek();
    this.position++;
    return token;
  }

  private check(type: string): boolean {
    return this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }
}
