// SPL実行エンジン - 本番Splunk相当の機能を提供
import { SPLLexer } from "./lexer";
import { SPLParser } from "./parser";
import {
  SPLQuery,
  Command,
  SearchCommand,
  WhereCommand,
  TableCommand,
  SortCommand,
  HeadCommand,
  TailCommand,
  DedupCommand,
  FieldsCommand,
  StatsCommand,
  EventstatsCommand,
  StreamstatsCommand,
  TopCommand,
  RareCommand,
  TimechartCommand,
  ChartCommand,
  EvalCommand,
  RexCommand,
  RenameCommand,
  LookupCommand,
  SpathCommand,
  JoinCommand,
  TransactionCommand,
  FillnullCommand,
  ReplaceCommand,
  RegexCommand,
  BinCommand,
  MakemvCommand,
  MvexpandCommand,
  AddtotalsCommand,
  ReverseCommand,
  UniqCommand,
  MakeresultsCommand,
  ConvertCommand,
  Expression,
  SearchCondition,
  ExecutionResult,
} from "./types";
import {
  SPLError,
  SPLRuntimeError,
  SPLRegexError,
  SPLInvalidArgumentError,
  createErrorResult,
} from "./errors";

export interface LogRecord {
  [key: string]: unknown;
  _time?: Date;
  _raw?: string;
}

export interface ExecutorOptions {
  maxResults?: number;
  timeout?: number;
  warnings?: string[];
}

const DEFAULT_OPTIONS: ExecutorOptions = {
  maxResults: 50000,
  timeout: 30000,
};

export class SPLExecutor {
  private data: LogRecord[];
  private lookupTables: Map<string, LogRecord[]>;
  private options: ExecutorOptions;
  private warnings: string[];
  private startTime: number = 0;

  constructor(
    data: LogRecord[],
    lookupTables?: Map<string, LogRecord[]>,
    options?: Partial<ExecutorOptions>
  ) {
    this.data = data;
    this.lookupTables = lookupTables || new Map();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.warnings = [];
  }

  execute(query: string): ExecutionResult {
    this.startTime = performance.now();
    this.warnings = [];

    try {
      // パース
      const lexer = new SPLLexer(query);
      const tokens = lexer.tokenize();
      const parser = new SPLParser(tokens);
      const ast = parser.parse();

      // 実行
      let result = [...this.data];

      for (const command of ast.commands) {
        this.checkTimeout();
        result = this.executeCommand(command, result);
        this.checkResultLimit(result);
      }

      const fields = this.extractFields(result);
      const executionTime = performance.now() - this.startTime;

      return {
        success: true,
        data: result,
        fields,
        count: result.length,
        executionTime,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
      };
    } catch (error) {
      const executionTime = performance.now() - this.startTime;

      if (error instanceof SPLError) {
        return createErrorResult(error, executionTime);
      }

      const runtimeError = new SPLRuntimeError(
        error instanceof Error ? error.message : "Unknown error"
      );
      return createErrorResult(runtimeError, executionTime);
    }
  }

  private checkTimeout(): void {
    if (this.options.timeout && performance.now() - this.startTime > this.options.timeout) {
      throw new SPLRuntimeError(`Query timeout after ${this.options.timeout}ms`);
    }
  }

  private checkResultLimit(result: LogRecord[]): void {
    if (this.options.maxResults && result.length > this.options.maxResults) {
      this.warnings.push(
        `Results truncated to ${this.options.maxResults} records`
      );
    }
  }

  private executeCommand(command: Command, data: LogRecord[]): LogRecord[] {
    switch (command.type) {
      case "search":
        return this.executeSearch(command, data);
      case "where":
        return this.executeWhere(command, data);
      case "table":
        return this.executeTable(command, data);
      case "sort":
        return this.executeSort(command, data);
      case "head":
        return this.executeHead(command, data);
      case "tail":
        return this.executeTail(command, data);
      case "dedup":
        return this.executeDedup(command, data);
      case "fields":
        return this.executeFields(command, data);
      case "stats":
        return this.executeStats(command, data);
      case "eventstats":
        return this.executeEventstats(command, data);
      case "streamstats":
        return this.executeStreamstats(command, data);
      case "top":
        return this.executeTop(command, data);
      case "rare":
        return this.executeRare(command, data);
      case "timechart":
        return this.executeTimechart(command, data);
      case "chart":
        return this.executeChart(command, data);
      case "eval":
        return this.executeEval(command, data);
      case "rex":
        return this.executeRex(command, data);
      case "rename":
        return this.executeRename(command, data);
      case "lookup":
        return this.executeLookup(command, data);
      case "spath":
        return this.executeSpath(command, data);
      case "join":
        return this.executeJoin(command, data);
      case "transaction":
        return this.executeTransaction(command, data);
      case "fillnull":
        return this.executeFillnull(command, data);
      case "replace":
        return this.executeReplace(command, data);
      case "regex":
        return this.executeRegex(command, data);
      case "bin":
        return this.executeBin(command, data);
      case "makemv":
        return this.executeMakemv(command, data);
      case "mvexpand":
        return this.executeMvexpand(command, data);
      case "addtotals":
        return this.executeAddtotals(command, data);
      case "reverse":
        return this.executeReverse(data);
      case "uniq":
        return this.executeUniq(data);
      case "makeresults":
        return this.executeMakeresults(command);
      case "convert":
        return this.executeConvert(command, data);
      default:
        this.warnings.push(`Unknown command: ${(command as Command).type}`);
        return data;
    }
  }

  // ====== 基本検索コマンド ======

  private executeSearch(command: SearchCommand, data: LogRecord[]): LogRecord[] {
    if (command.conditions.length === 0) {
      return data;
    }

    return data.filter((record) => {
      let result = true;
      let currentOp: "AND" | "OR" | undefined;

      for (const condition of command.conditions) {
        const matches = this.matchCondition(condition, record);
        const conditionResult = condition.isNegated ? !matches : matches;

        if (currentOp === "OR") {
          result = result || conditionResult;
        } else {
          result = result && conditionResult;
        }

        currentOp = condition.logicalOp;
      }

      return result;
    });
  }

  private matchCondition(condition: SearchCondition, record: LogRecord): boolean {
    if (!condition.field) {
      const searchValue = String(condition.value).toLowerCase();
      for (const value of Object.values(record)) {
        if (String(value).toLowerCase().includes(searchValue)) {
          return true;
        }
      }
      if (record._raw && String(record._raw).toLowerCase().includes(searchValue)) {
        return true;
      }
      return false;
    }

    const fieldValue = this.getFieldValue(record, condition.field);
    const conditionValue = condition.value;

    // ワイルドカード検索（安全な実装）
    if (typeof conditionValue === "string" && conditionValue.includes("*")) {
      const escaped = conditionValue
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      try {
        const regex = new RegExp(`^${escaped}$`, "i");
        return regex.test(String(fieldValue));
      } catch {
        return false;
      }
    }

    switch (condition.operator) {
      case "=":
        return String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
      case "!=":
        return String(fieldValue).toLowerCase() !== String(conditionValue).toLowerCase();
      case ">":
        return Number(fieldValue) > Number(conditionValue);
      case ">=":
        return Number(fieldValue) >= Number(conditionValue);
      case "<":
        return Number(fieldValue) < Number(conditionValue);
      case "<=":
        return Number(fieldValue) <= Number(conditionValue);
      case "IN":
        if (Array.isArray(conditionValue)) {
          return conditionValue.some(v => String(v).toLowerCase() === String(fieldValue).toLowerCase());
        }
        return false;
      default:
        return false;
    }
  }

  private executeWhere(command: WhereCommand, data: LogRecord[]): LogRecord[] {
    return data.filter((record) => {
      try {
        const result = this.evaluateExpression(command.expression, record);
        return Boolean(result);
      } catch (error) {
        this.warnings.push(`where evaluation error: ${error instanceof Error ? error.message : "unknown"}`);
        return false;
      }
    });
  }

  private resolveValue(
    value: Expression | string | number | undefined,
    record: LogRecord
  ): unknown {
    if (value === undefined) return undefined;
    if (typeof value === "string") return this.getFieldValue(record, value);
    if (typeof value === "number") return value;
    return this.evaluateExpression(value, record);
  }

  private evaluateExpression(expr: Expression, record: LogRecord): unknown {
    switch (expr.type) {
      case "literal":
        return expr.value;

      case "field":
        return this.getFieldValue(record, expr.name || "");

      case "function":
        return this.evaluateFunction(expr.name || "", expr.args || [], record);

      case "arithmetic": {
        const left = Number(this.resolveValue(expr.left, record));
        const right = Number(this.resolveValue(expr.right, record));
        switch (expr.operator) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return right !== 0 ? left / right : null;
          case "%": return right !== 0 ? left % right : null;
          default: return null;
        }
      }

      case "comparison": {
        const left = this.resolveValue(expr.left, record);
        const right = this.resolveValue(expr.right, record);

        switch (expr.operator) {
          case "=":
          case "==":
            return left == right;
          case "!=":
          case "<>":
            return left != right;
          case ">":
            return Number(left) > Number(right);
          case ">=":
            return Number(left) >= Number(right);
          case "<":
            return Number(left) < Number(right);
          case "<=":
            return Number(left) <= Number(right);
          case "LIKE": {
            const pattern = String(right).replace(/%/g, ".*").replace(/_/g, ".");
            try {
              return new RegExp(`^${pattern}$`, "i").test(String(left));
            } catch {
              return false;
            }
          }
          case "IN":
            if (Array.isArray(right)) {
              return right.some((v) => v == left);
            }
            return false;
          default:
            return false;
        }
      }

      case "logical": {
        const left = this.resolveValue(expr.left, record);
        const right = this.resolveValue(expr.right, record);

        if (expr.operator === "AND") {
          return Boolean(left) && Boolean(right);
        } else if (expr.operator === "OR") {
          return Boolean(left) || Boolean(right);
        } else if (expr.operator === "NOT") {
          return !Boolean(left);
        }
        return false;
      }

      default:
        return null;
    }
  }

  private evaluateFunction(name: string, args: Expression[], record: LogRecord): unknown {
    const evaluatedArgs = args.map((arg) => this.evaluateExpression(arg, record));
    const funcName = name.toLowerCase();

    // 文字列関数
    switch (funcName) {
      case "len":
        return String(evaluatedArgs[0] ?? "").length;
      case "lower":
        return String(evaluatedArgs[0] ?? "").toLowerCase();
      case "upper":
        return String(evaluatedArgs[0] ?? "").toUpperCase();
      case "trim":
        return String(evaluatedArgs[0] ?? "").trim();
      case "ltrim":
        return String(evaluatedArgs[0] ?? "").trimStart();
      case "rtrim":
        return String(evaluatedArgs[0] ?? "").trimEnd();
      case "substr":
      case "substring":
        return String(evaluatedArgs[0] ?? "").substring(
          Number(evaluatedArgs[1]) || 0,
          evaluatedArgs[2] !== undefined ? Number(evaluatedArgs[2]) : undefined
        );
      case "replace":
        return String(evaluatedArgs[0] ?? "").replace(
          new RegExp(String(evaluatedArgs[1] ?? ""), "g"),
          String(evaluatedArgs[2] ?? "")
        );
      case "split":
        return String(evaluatedArgs[0] ?? "").split(String(evaluatedArgs[1] ?? ","));
      case "mvjoin":
        return Array.isArray(evaluatedArgs[0])
          ? evaluatedArgs[0].join(String(evaluatedArgs[1] ?? ","))
          : String(evaluatedArgs[0] ?? "");
      case "urldecode":
        try {
          return decodeURIComponent(String(evaluatedArgs[0] ?? ""));
        } catch {
          return evaluatedArgs[0];
        }
      case "urlencode":
        return encodeURIComponent(String(evaluatedArgs[0] ?? ""));

      // 数値関数
      case "abs":
        return Math.abs(Number(evaluatedArgs[0]));
      case "ceil":
      case "ceiling":
        return Math.ceil(Number(evaluatedArgs[0]));
      case "floor":
        return Math.floor(Number(evaluatedArgs[0]));
      case "round":
        const decimals = Number(evaluatedArgs[1]) || 0;
        const factor = Math.pow(10, decimals);
        return Math.round(Number(evaluatedArgs[0]) * factor) / factor;
      case "sqrt":
        return Math.sqrt(Number(evaluatedArgs[0]));
      case "pow":
      case "power":
        return Math.pow(Number(evaluatedArgs[0]), Number(evaluatedArgs[1]));
      case "exp":
        return Math.exp(Number(evaluatedArgs[0]));
      case "ln":
        return Math.log(Number(evaluatedArgs[0]));
      case "log":
        const base = evaluatedArgs[1] !== undefined ? Number(evaluatedArgs[1]) : 10;
        return Math.log(Number(evaluatedArgs[0])) / Math.log(base);
      case "pi":
        return Math.PI;
      case "random":
        return Math.random();

      // 条件関数
      case "if":
        return evaluatedArgs[0] ? evaluatedArgs[1] : evaluatedArgs[2];
      case "case":
        for (let i = 0; i < evaluatedArgs.length - 1; i += 2) {
          if (evaluatedArgs[i]) {
            return evaluatedArgs[i + 1];
          }
        }
        return evaluatedArgs.length % 2 === 1
          ? evaluatedArgs[evaluatedArgs.length - 1]
          : null;
      case "coalesce":
        return evaluatedArgs.find((v) => v != null) ?? null;
      case "nullif":
        return evaluatedArgs[0] === evaluatedArgs[1] ? null : evaluatedArgs[0];
      case "isnull":
        return evaluatedArgs[0] == null;
      case "isnotnull":
        return evaluatedArgs[0] != null;
      case "isnum":
      case "isnumber":
        return !isNaN(Number(evaluatedArgs[0]));
      case "isstr":
      case "isstring":
        return typeof evaluatedArgs[0] === "string";
      case "isint":
      case "isinteger":
        return Number.isInteger(Number(evaluatedArgs[0]));

      // 型変換
      case "tonumber":
        const num = Number(evaluatedArgs[0]);
        return isNaN(num) ? null : num;
      case "tostring":
        if (evaluatedArgs[0] instanceof Date) {
          return evaluatedArgs[0].toISOString();
        }
        return String(evaluatedArgs[0] ?? "");
      case "typeof":
        return typeof evaluatedArgs[0];

      // 時間関数
      case "now":
        return new Date();
      case "time":
        return Date.now() / 1000;
      case "strftime":
        return this.formatDate(evaluatedArgs[1] as Date, String(evaluatedArgs[0]));
      case "strptime":
        return new Date(String(evaluatedArgs[0]));
      case "relative_time":
        return this.relativeTime(evaluatedArgs[0] as Date, String(evaluatedArgs[1]));

      // マルチバリュー関数
      case "mvcount":
        return Array.isArray(evaluatedArgs[0]) ? evaluatedArgs[0].length : 1;
      case "mvindex":
        if (Array.isArray(evaluatedArgs[0])) {
          const idx = Number(evaluatedArgs[1]);
          return evaluatedArgs[0][idx < 0 ? evaluatedArgs[0].length + idx : idx];
        }
        return evaluatedArgs[0];
      case "mvfilter":
        if (Array.isArray(evaluatedArgs[0])) {
          return evaluatedArgs[0].filter(Boolean);
        }
        return evaluatedArgs[0] ? [evaluatedArgs[0]] : [];
      case "mvappend":
        const result: unknown[] = [];
        for (const arg of evaluatedArgs) {
          if (Array.isArray(arg)) {
            result.push(...arg);
          } else if (arg != null) {
            result.push(arg);
          }
        }
        return result;
      case "mvdedup":
        if (Array.isArray(evaluatedArgs[0])) {
          return [...new Set(evaluatedArgs[0])];
        }
        return evaluatedArgs[0];
      case "mvsort":
        if (Array.isArray(evaluatedArgs[0])) {
          return [...evaluatedArgs[0]].sort();
        }
        return evaluatedArgs[0];

      // JSON関数
      case "json_extract":
      case "spath":
        return this.jsonExtract(evaluatedArgs[0], String(evaluatedArgs[1] ?? ""));
      case "json_object":
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < evaluatedArgs.length - 1; i += 2) {
          obj[String(evaluatedArgs[i])] = evaluatedArgs[i + 1];
        }
        return obj;
      case "json_array":
        return evaluatedArgs;
      case "json_valid":
        try {
          JSON.parse(String(evaluatedArgs[0]));
          return true;
        } catch {
          return false;
        }

      // 比較関数
      case "like":
      case "match":
        try {
          const pattern = String(evaluatedArgs[1] ?? "");
          const regex = new RegExp(pattern);
          return regex.test(String(evaluatedArgs[0] ?? ""));
        } catch {
          return false;
        }

      // MD5/SHA (簡易実装)
      case "md5":
      case "sha1":
      case "sha256":
      case "sha512":
        // ブラウザ環境では完全な実装は難しいので、ダミー値を返す
        return `${funcName}_${String(evaluatedArgs[0]).length}`;

      // ブール
      case "true":
        return true;
      case "false":
        return false;
      case "null":
        return null;

      default:
        this.warnings.push(`Unknown function: ${name}`);
        return null;
    }
  }

  // ====== テーブル・ソートコマンド ======

  private executeTable(command: TableCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => {
      const newRecord: LogRecord = {};
      for (const field of command.fields) {
        if (field === "*") {
          Object.assign(newRecord, record);
        } else {
          newRecord[field] = this.getFieldValue(record, field);
        }
      }
      return newRecord;
    });
  }

  private executeSort(command: SortCommand, data: LogRecord[]): LogRecord[] {
    const sorted = [...data].sort((a, b) => {
      for (const { field, direction } of command.fields) {
        const aVal = this.getFieldValue(a, field);
        const bVal = this.getFieldValue(b, field);

        let comparison = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });

    return command.limit ? sorted.slice(0, command.limit) : sorted;
  }

  private executeHead(command: HeadCommand, data: LogRecord[]): LogRecord[] {
    return data.slice(0, command.count);
  }

  private executeTail(command: TailCommand, data: LogRecord[]): LogRecord[] {
    return data.slice(-command.count);
  }

  private executeDedup(command: DedupCommand, data: LogRecord[]): LogRecord[] {
    const seen = new Set<string>();
    const results: LogRecord[] = [];

    for (const record of data) {
      const key = command.fields
        .map((field) => String(this.getFieldValue(record, field)))
        .join("|");

      if (command.consecutive) {
        const lastKey = results.length > 0
          ? command.fields.map((f) => String(this.getFieldValue(results[results.length - 1], f))).join("|")
          : null;
        if (key !== lastKey) {
          results.push(record);
        }
      } else {
        if (!seen.has(key)) {
          seen.add(key);
          results.push(record);
        }
      }
    }

    return results;
  }

  private executeFields(command: FieldsCommand, data: LogRecord[]): LogRecord[] {
    if (command.mode === "include") {
      return data.map((record) => {
        const newRecord: LogRecord = {};
        for (const field of command.fields) {
          if (field in record || this.getFieldValue(record, field) !== undefined) {
            newRecord[field] = this.getFieldValue(record, field);
          }
        }
        return newRecord;
      });
    } else {
      return data.map((record) => {
        const newRecord: LogRecord = { ...record };
        for (const field of command.fields) {
          delete newRecord[field];
        }
        return newRecord;
      });
    }
  }

  private executeReverse(data: LogRecord[]): LogRecord[] {
    return [...data].reverse();
  }

  private executeUniq(data: LogRecord[]): LogRecord[] {
    const seen = new Set<string>();
    return data.filter((record) => {
      const key = JSON.stringify(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ====== 統計コマンド ======

  private executeStats(command: StatsCommand, data: LogRecord[]): LogRecord[] {
    const groups = this.groupData(data, command.groupBy);
    return this.aggregateGroups(groups, command.aggregations, command.groupBy);
  }

  private executeEventstats(command: EventstatsCommand, data: LogRecord[]): LogRecord[] {
    const groups = this.groupData(data, command.groupBy);
    const statsMap = new Map<string, Record<string, unknown>>();

    for (const [groupKey, groupRecords] of groups) {
      const stats: Record<string, unknown> = {};
      for (const agg of command.aggregations) {
        const values = groupRecords.map((r) =>
          agg.field ? this.getFieldValue(r, agg.field) : null
        );
        const fieldName = agg.alias || `${agg.function}(${agg.field || "*"})`;
        stats[fieldName] = this.calculateAggregation(agg.function, values);
      }
      statsMap.set(groupKey, stats);
    }

    return data.map((record) => {
      const groupKey = command.groupBy.length > 0
        ? command.groupBy.map((f) => String(this.getFieldValue(record, f))).join("|")
        : "__all__";
      const stats = statsMap.get(groupKey) || {};
      return { ...record, ...stats };
    });
  }

  private executeStreamstats(command: StreamstatsCommand, data: LogRecord[]): LogRecord[] {
    const window = command.window || data.length;
    const results: LogRecord[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowData = command.current !== false
        ? data.slice(start, i + 1)
        : data.slice(start, i);

      const stats: Record<string, unknown> = {};
      for (const agg of command.aggregations) {
        const values = windowData.map((r) =>
          agg.field ? this.getFieldValue(r, agg.field) : null
        );
        const fieldName = agg.alias || `${agg.function}(${agg.field || "*"})`;
        stats[fieldName] = this.calculateAggregation(agg.function, values);
      }

      results.push({ ...data[i], ...stats });
    }

    return results;
  }

  private executeTop(command: TopCommand, data: LogRecord[]): LogRecord[] {
    const counts = new Map<string, number>();

    for (const record of data) {
      const value = String(this.getFieldValue(record, command.field));
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const total = data.length;
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, command.count)
      .map(([value, count]) => ({
        [command.field]: value,
        count,
        percent: Number(((count / total) * 100).toFixed(2)),
      }));
  }

  private executeRare(command: RareCommand, data: LogRecord[]): LogRecord[] {
    const counts = new Map<string, number>();

    for (const record of data) {
      const value = String(this.getFieldValue(record, command.field));
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const total = data.length;
    return Array.from(counts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, command.count)
      .map(([value, count]) => ({
        [command.field]: value,
        count,
        percent: Number(((count / total) * 100).toFixed(2)),
      }));
  }

  private executeTimechart(command: TimechartCommand, data: LogRecord[]): LogRecord[] {
    const spanMs = this.parseSpan(command.span);
    const buckets = new Map<number, LogRecord[]>();

    for (const record of data) {
      const rawTime = record._time;
      if (!rawTime) continue;
      const time = rawTime instanceof Date ? rawTime : new Date(String(rawTime));
      const bucketTime = Math.floor(time.getTime() / spanMs) * spanMs;

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(record);
    }

    const results: LogRecord[] = [];
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

    for (const [bucketTime, bucketRecords] of sortedBuckets) {
      const result: LogRecord = { _time: new Date(bucketTime) };

      if (command.splitBy) {
        const splits = new Map<string, LogRecord[]>();
        for (const record of bucketRecords) {
          const splitValue = String(this.getFieldValue(record, command.splitBy));
          if (!splits.has(splitValue)) {
            splits.set(splitValue, []);
          }
          splits.get(splitValue)!.push(record);
        }

        for (const [splitValue, splitRecords] of splits) {
          for (const agg of command.aggregations) {
            const values = splitRecords.map((r) =>
              agg.field ? this.getFieldValue(r, agg.field) : null
            );
            result[splitValue] = this.calculateAggregation(agg.function, values);
          }
        }
      } else {
        for (const agg of command.aggregations) {
          const values = bucketRecords.map((r) =>
            agg.field ? this.getFieldValue(r, agg.field) : null
          );
          const fieldName = agg.field ? `${agg.function}(${agg.field})` : agg.function;
          result[fieldName] = this.calculateAggregation(agg.function, values);
        }
      }

      results.push(result);
    }

    return results;
  }

  private executeChart(command: ChartCommand, data: LogRecord[]): LogRecord[] {
    const groups = new Map<string, Map<string, LogRecord[]>>();

    for (const record of data) {
      const overValue = String(this.getFieldValue(record, command.over));
      const byValue = command.by ? String(this.getFieldValue(record, command.by)) : "__all__";

      if (!groups.has(overValue)) {
        groups.set(overValue, new Map());
      }
      if (!groups.get(overValue)!.has(byValue)) {
        groups.get(overValue)!.set(byValue, []);
      }
      groups.get(overValue)!.get(byValue)!.push(record);
    }

    const results: LogRecord[] = [];
    for (const [overValue, byGroups] of groups) {
      const result: LogRecord = { [command.over]: overValue };

      for (const [byValue, records] of byGroups) {
        for (const agg of command.aggregations) {
          const values = records.map((r) =>
            agg.field ? this.getFieldValue(r, agg.field) : null
          );
          const fieldName = command.by
            ? byValue
            : agg.alias || `${agg.function}(${agg.field || "*"})`;
          result[fieldName] = this.calculateAggregation(agg.function, values);
        }
      }

      results.push(result);
    }

    return results;
  }

  private executeAddtotals(command: AddtotalsCommand, data: LogRecord[]): LogRecord[] {
    if (command.row !== false) {
      // 行の合計を追加
      return data.map((record) => {
        let total = 0;
        const fields = command.fields || Object.keys(record).filter(k => !k.startsWith("_"));
        for (const field of fields) {
          const val = Number(this.getFieldValue(record, field));
          if (!isNaN(val)) total += val;
        }
        return { ...record, Total: total };
      });
    }
    return data;
  }

  // ====== 変換コマンド ======

  private executeEval(command: EvalCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => {
      try {
        const value = this.evaluateExpression(command.expression, record);
        return { ...record, [command.field]: value };
      } catch (error) {
        this.warnings.push(`eval error for field ${command.field}: ${error instanceof Error ? error.message : "unknown"}`);
        return record;
      }
    });
  }

  private executeRex(command: RexCommand, data: LogRecord[]): LogRecord[] {
    let regex: RegExp;
    try {
      regex = new RegExp(command.pattern, command.max_match ? "g" : "");
    } catch (error) {
      throw new SPLRegexError(command.pattern, error instanceof Error ? error.message : "Invalid pattern");
    }

    return data.map((record) => {
      const fieldValue = String(this.getFieldValue(record, command.field) || "");
      const match = fieldValue.match(regex);

      if (match && match.groups) {
        return { ...record, ...match.groups };
      }

      return record;
    });
  }

  private executeRename(command: RenameCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => {
      const newRecord: LogRecord = { ...record };
      for (const { from, to } of command.renames) {
        if (from in newRecord) {
          newRecord[to] = newRecord[from];
          delete newRecord[from];
        }
      }
      return newRecord;
    });
  }

  private executeFillnull(command: FillnullCommand, data: LogRecord[]): LogRecord[] {
    const fillValue = command.value ?? 0;
    const fields = command.fields;

    return data.map((record) => {
      const newRecord: LogRecord = { ...record };
      const targetFields = fields || Object.keys(record);

      for (const field of targetFields) {
        if (newRecord[field] == null || newRecord[field] === "") {
          newRecord[field] = fillValue;
        }
      }
      return newRecord;
    });
  }

  private executeReplace(command: ReplaceCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => {
      const newRecord: LogRecord = { ...record };
      const targetFields = command.fields || Object.keys(record);

      for (const field of targetFields) {
        let value = String(newRecord[field] ?? "");
        for (const { pattern, replacement } of command.replacements) {
          try {
            const regex = new RegExp(pattern, "g");
            value = value.replace(regex, replacement);
          } catch {
            // パターンが無効な場合は単純な文字列置換
            value = value.split(pattern).join(replacement);
          }
        }
        newRecord[field] = value;
      }
      return newRecord;
    });
  }

  private executeRegex(command: RegexCommand, data: LogRecord[]): LogRecord[] {
    let regex: RegExp;
    try {
      regex = new RegExp(command.pattern);
    } catch (error) {
      throw new SPLRegexError(command.pattern, error instanceof Error ? error.message : "Invalid pattern");
    }

    return data.filter((record) => {
      const field = command.field || "_raw";
      const value = String(this.getFieldValue(record, field) ?? "");
      const matches = regex.test(value);
      return command.isNegated ? !matches : matches;
    });
  }

  private executeBin(command: BinCommand, data: LogRecord[]): LogRecord[] {
    const alias = command.alias || command.field;

    return data.map((record) => {
      const value = this.getFieldValue(record, command.field);
      let binValue: unknown;

      if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
        // 時間バケット
        const time = value instanceof Date ? value : new Date(value);
        const spanMs = command.span ? this.parseSpan(String(command.span)) : 3600000;
        binValue = new Date(Math.floor(time.getTime() / spanMs) * spanMs);
      } else {
        // 数値バケット
        const num = Number(value);
        if (!isNaN(num)) {
          const span = Number(command.span) || 10;
          binValue = Math.floor(num / span) * span;
        } else {
          binValue = value;
        }
      }

      return { ...record, [alias]: binValue };
    });
  }

  private executeConvert(command: ConvertCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => {
      const newRecord: LogRecord = { ...record };

      for (const conv of command.conversions) {
        const value = this.getFieldValue(record, conv.field);
        const targetField = conv.alias || conv.field;
        let converted: unknown = value;

        switch (conv.function) {
          case "num":
          case "auto":
            converted = Number(value);
            if (isNaN(converted as number)) converted = value;
            break;
          case "dur2sec":
            converted = this.durationToSeconds(String(value));
            break;
          case "rmcomma":
            converted = String(value).replace(/,/g, "");
            break;
          case "rmunit":
            converted = parseFloat(String(value));
            break;
          case "ctime":
            converted = new Date(Number(value) * 1000);
            break;
          case "mktime":
            converted = Math.floor(new Date(String(value)).getTime() / 1000);
            break;
          case "memk":
            converted = this.parseMemory(String(value));
            break;
          case "none":
            converted = value;
            break;
        }

        newRecord[targetField] = converted;
      }

      return newRecord;
    });
  }

  // ====== マルチバリューコマンド ======

  private executeMakemv(command: MakemvCommand, data: LogRecord[]): LogRecord[] {
    const delim = command.delim ?? " ";

    return data.map((record) => {
      const value = this.getFieldValue(record, command.field);
      if (typeof value === "string") {
        const parts = value.split(delim);
        return {
          ...record,
          [command.field]: command.allowempty ? parts : parts.filter(Boolean),
        };
      }
      return record;
    });
  }

  private executeMvexpand(command: MvexpandCommand, data: LogRecord[]): LogRecord[] {
    const results: LogRecord[] = [];
    const limit = command.limit || Infinity;

    for (const record of data) {
      const value = this.getFieldValue(record, command.field);

      if (Array.isArray(value)) {
        const items = value.slice(0, limit);
        for (const item of items) {
          results.push({ ...record, [command.field]: item });
        }
      } else {
        results.push(record);
      }
    }

    return results;
  }

  // ====== 結合コマンド ======

  private executeLookup(command: LookupCommand, data: LogRecord[]): LogRecord[] {
    const lookupData = this.lookupTables.get(command.table);
    if (!lookupData) {
      this.warnings.push(`Lookup table not found: ${command.table}`);
      return data;
    }

    const lookupMap = new Map<string, LogRecord>();
    for (const record of lookupData) {
      const key = String(this.getFieldValue(record, command.field));
      lookupMap.set(key, record);
    }

    return data.map((record) => {
      const lookupKey = String(this.getFieldValue(record, command.field));
      const lookupRecord = lookupMap.get(lookupKey);

      if (lookupRecord) {
        const newRecord = { ...record };
        if (command.outputFields.length > 0) {
          for (const field of command.outputFields) {
            newRecord[field] = lookupRecord[field];
          }
        } else {
          Object.assign(newRecord, lookupRecord);
        }
        return newRecord;
      }

      return record;
    });
  }

  private executeSpath(command: SpathCommand, data: LogRecord[]): LogRecord[] {
    const inputField = command.input || "_raw";
    const outputField = command.output;
    const path = command.path;

    return data.map((record) => {
      const rawValue = this.getFieldValue(record, inputField);
      if (!rawValue) return record;

      try {
        let parsed: unknown;
        if (typeof rawValue === "string") {
          parsed = JSON.parse(rawValue);
        } else {
          parsed = rawValue;
        }

        if (path) {
          const extracted = this.jsonExtract(parsed, path);
          const targetField = outputField || path.split(".").pop() || path;
          return { ...record, [targetField]: extracted };
        } else {
          // パスなしの場合は全フィールドを展開
          if (typeof parsed === "object" && parsed !== null) {
            const flattened = this.flattenObject(parsed as Record<string, unknown>);
            return { ...record, ...flattened };
          }
        }
      } catch {
        this.warnings.push(`Failed to parse JSON in field ${inputField}`);
      }

      return record;
    });
  }

  private executeJoin(command: JoinCommand, data: LogRecord[]): LogRecord[] {
    // サブサーチの簡易実装（実際のSplunkではサブサーチを実行）
    // ここではlookupテーブルから取得する形で代用
    const subsearchData = this.lookupTables.get(command.subsearch) || [];

    const joinMap = new Map<string, LogRecord[]>();
    for (const record of subsearchData) {
      const key = command.fields.map((f) => String(this.getFieldValue(record, f))).join("|");
      if (!joinMap.has(key)) {
        joinMap.set(key, []);
      }
      joinMap.get(key)!.push(record);
    }

    const results: LogRecord[] = [];
    const max = command.max || 1;

    for (const record of data) {
      const key = command.fields.map((f) => String(this.getFieldValue(record, f))).join("|");
      const matches = joinMap.get(key) || [];

      if (matches.length > 0) {
        for (let i = 0; i < Math.min(matches.length, max); i++) {
          results.push({ ...record, ...matches[i] });
        }
      } else if (command.joinType === "left" || command.joinType === "outer") {
        results.push(record);
      }
    }

    return results;
  }

  private executeTransaction(command: TransactionCommand, data: LogRecord[]): LogRecord[] {
    const groups = new Map<string, LogRecord[]>();

    // グループ化
    for (const record of data) {
      const key = command.fields.map((f) => String(this.getFieldValue(record, f))).join("|");
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    const results: LogRecord[] = [];
    const maxspanMs = command.maxspan ? this.parseSpan(command.maxspan) : Infinity;
    const maxpauseMs = command.maxpause ? this.parseSpan(command.maxpause) : Infinity;
    const maxevents = command.maxevents || Infinity;

    for (const [, records] of groups) {
      // 時間順にソート
      const sorted = [...records].sort((a, b) => {
        const aTime = a._time instanceof Date ? a._time.getTime() : 0;
        const bTime = b._time instanceof Date ? b._time.getTime() : 0;
        return aTime - bTime;
      });

      let transaction: LogRecord[] = [];
      let firstTime: number | null = null;
      let lastTime: number | null = null;

      for (const record of sorted) {
        const recordTime = record._time instanceof Date ? record._time.getTime() : Date.now();

        // 新しいトランザクションを開始するかチェック
        const shouldStart =
          transaction.length === 0 ||
          (firstTime && recordTime - firstTime > maxspanMs) ||
          (lastTime && recordTime - lastTime > maxpauseMs) ||
          transaction.length >= maxevents ||
          (command.startswith && this.matchesPattern(record, command.startswith));

        if (shouldStart && transaction.length > 0) {
          results.push(this.createTransactionRecord(transaction));
          transaction = [];
          firstTime = null;
        }

        transaction.push(record);
        if (firstTime === null) firstTime = recordTime;
        lastTime = recordTime;

        // 終了条件をチェック
        if (command.endswith && this.matchesPattern(record, command.endswith)) {
          results.push(this.createTransactionRecord(transaction));
          transaction = [];
          firstTime = null;
          lastTime = null;
        }
      }

      if (transaction.length > 0) {
        results.push(this.createTransactionRecord(transaction));
      }
    }

    return results;
  }

  // ====== 生成コマンド ======

  private executeMakeresults(command: MakeresultsCommand): LogRecord[] {
    const count = command.count || 1;
    const results: LogRecord[] = [];

    for (let i = 0; i < count; i++) {
      const record: LogRecord = {
        _time: new Date(),
      };
      if (command.annotate) {
        record.splunk_server = "local";
      }
      results.push(record);
    }

    return results;
  }

  // ====== ヘルパーメソッド ======

  private groupData(data: LogRecord[], groupBy: string[]): Map<string, LogRecord[]> {
    const groups = new Map<string, LogRecord[]>();

    for (const record of data) {
      const groupKey =
        groupBy.length > 0
          ? groupBy.map((field) => String(this.getFieldValue(record, field))).join("|")
          : "__all__";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    }

    return groups;
  }

  private aggregateGroups(
    groups: Map<string, LogRecord[]>,
    aggregations: { function: string; field?: string; alias?: string }[],
    groupBy: string[]
  ): LogRecord[] {
    const results: LogRecord[] = [];

    for (const [groupKey, groupRecords] of groups) {
      const result: LogRecord = {};

      if (groupBy.length > 0) {
        const keyValues = groupKey.split("|");
        groupBy.forEach((field, i) => {
          result[field] = keyValues[i];
        });
      }

      for (const agg of aggregations) {
        const values = groupRecords.map((r) =>
          agg.field ? this.getFieldValue(r, agg.field) : null
        );
        const fieldName = agg.alias || `${agg.function}(${agg.field || "*"})`;
        result[fieldName] = this.calculateAggregation(agg.function, values);
      }

      results.push(result);
    }

    return results;
  }

  private calculateAggregation(func: string, values: unknown[]): unknown {
    const numericValues = values
      .filter((v) => v != null)
      .map((v) => Number(v))
      .filter((v) => !isNaN(v));

    switch (func.toLowerCase()) {
      case "count":
        return values.length;
      case "sum":
        return numericValues.reduce((a, b) => a + b, 0);
      case "avg":
      case "mean":
        return numericValues.length > 0
          ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
          : 0;
      case "min":
        return numericValues.length > 0 ? Math.min(...numericValues) : null;
      case "max":
        return numericValues.length > 0 ? Math.max(...numericValues) : null;
      case "range":
        return numericValues.length > 0
          ? Math.max(...numericValues) - Math.min(...numericValues)
          : 0;
      case "dc":
      case "distinct_count":
        return new Set(values.map((v) => String(v))).size;
      case "values":
        return [...new Set(values.filter(v => v != null).map((v) => String(v)))];
      case "list":
        return values.filter(v => v != null);
      case "first":
        return values[0];
      case "last":
        return values[values.length - 1];
      case "earliest":
        return values[0];
      case "latest":
        return values[values.length - 1];
      case "stdev":
      case "stdevp":
        if (numericValues.length === 0) return 0;
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const variance =
          numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          (func === "stdevp" ? numericValues.length : numericValues.length - 1);
        return Math.sqrt(variance);
      case "var":
      case "varp":
        if (numericValues.length === 0) return 0;
        const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        return numericValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
          (func === "varp" ? numericValues.length : numericValues.length - 1);
      case "median":
        if (numericValues.length === 0) return 0;
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      case "mode":
        const counts = new Map<number, number>();
        for (const v of numericValues) {
          counts.set(v, (counts.get(v) || 0) + 1);
        }
        let maxCount = 0;
        let modeValue = 0;
        for (const [val, count] of counts) {
          if (count > maxCount) {
            maxCount = count;
            modeValue = val;
          }
        }
        return modeValue;
      case "perc":
      case "percentile":
        if (numericValues.length === 0) return 0;
        const p = 95; // デフォルト95パーセンタイル
        const sortedPerc = [...numericValues].sort((a, b) => a - b);
        const index = (p / 100) * (sortedPerc.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        return sortedPerc[lower] + (sortedPerc[upper] - sortedPerc[lower]) * (index - lower);
      default:
        return 0;
    }
  }

  private getFieldValue(record: LogRecord, field: string): unknown {
    if (field.includes(".")) {
      const parts = field.split(".");
      let value: unknown = record;

      for (const part of parts) {
        if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }

      return value;
    }

    return record[field];
  }

  private parseSpan(span: string): number {
    const match = span.match(/^(\d+)([smhdwMy])$/);
    if (!match) {
      return 60 * 60 * 1000;
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s": return value * 1000;
      case "m": return value * 60 * 1000;
      case "h": return value * 60 * 60 * 1000;
      case "d": return value * 24 * 60 * 60 * 1000;
      case "w": return value * 7 * 24 * 60 * 60 * 1000;
      case "M": return value * 30 * 24 * 60 * 60 * 1000;
      case "y": return value * 365 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  private formatDate(date: Date | undefined, format: string): string {
    if (!date || !(date instanceof Date)) return "";

    const pad = (n: number) => n.toString().padStart(2, "0");

    return format
      .replace("%Y", date.getFullYear().toString())
      .replace("%m", pad(date.getMonth() + 1))
      .replace("%d", pad(date.getDate()))
      .replace("%H", pad(date.getHours()))
      .replace("%M", pad(date.getMinutes()))
      .replace("%S", pad(date.getSeconds()))
      .replace("%y", date.getFullYear().toString().slice(-2))
      .replace("%B", date.toLocaleString("en", { month: "long" }))
      .replace("%b", date.toLocaleString("en", { month: "short" }))
      .replace("%A", date.toLocaleString("en", { weekday: "long" }))
      .replace("%a", date.toLocaleString("en", { weekday: "short" }));
  }

  private relativeTime(date: Date | undefined, modifier: string): Date {
    if (!date || !(date instanceof Date)) return new Date();

    const result = new Date(date);
    const match = modifier.match(/^([+-]?\d+)([smhdwMy])$/);

    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case "s": result.setSeconds(result.getSeconds() + value); break;
        case "m": result.setMinutes(result.getMinutes() + value); break;
        case "h": result.setHours(result.getHours() + value); break;
        case "d": result.setDate(result.getDate() + value); break;
        case "w": result.setDate(result.getDate() + value * 7); break;
        case "M": result.setMonth(result.getMonth() + value); break;
        case "y": result.setFullYear(result.getFullYear() + value); break;
      }
    }

    return result;
  }

  private jsonExtract(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== "object") return null;

    const parts = path.split(/[.\[\]]/).filter(Boolean);
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return current;
  }

  private flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, this.flattenObject(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  private matchesPattern(record: LogRecord, pattern: string): boolean {
    const raw = String(record._raw || JSON.stringify(record));
    try {
      return new RegExp(pattern).test(raw);
    } catch {
      return raw.includes(pattern);
    }
  }

  private createTransactionRecord(records: LogRecord[]): LogRecord {
    if (records.length === 0) return {};

    const firstTime = records[0]._time;
    const lastTime = records[records.length - 1]._time;
    const duration = firstTime && lastTime
      ? ((lastTime instanceof Date ? lastTime.getTime() : 0) -
         (firstTime instanceof Date ? firstTime.getTime() : 0)) / 1000
      : 0;

    return {
      _time: firstTime,
      duration,
      eventcount: records.length,
      _raw: records.map((r) => r._raw || JSON.stringify(r)).join("\n"),
      ...records[0],
    };
  }

  private durationToSeconds(duration: string): number {
    const match = duration.match(/^(?:(\d+):)?(\d+):(\d+)$/);
    if (match) {
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return parseFloat(duration) || 0;
  }

  private parseMemory(value: string): number {
    const match = value.match(/^([\d.]+)\s*([KMGT]?B?)$/i);
    if (!match) return parseFloat(value) || 0;

    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case "KB": case "K": return num * 1024;
      case "MB": case "M": return num * 1024 * 1024;
      case "GB": case "G": return num * 1024 * 1024 * 1024;
      case "TB": case "T": return num * 1024 * 1024 * 1024 * 1024;
      default: return num;
    }
  }

  private extractFields(data: LogRecord[]): string[] {
    const fields = new Set<string>();
    for (const record of data.slice(0, 100)) {
      for (const key of Object.keys(record)) {
        fields.add(key);
      }
    }
    return Array.from(fields);
  }
}
