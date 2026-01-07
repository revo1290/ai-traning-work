// SPL実行エンジン
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
  TopCommand,
  RareCommand,
  TimechartCommand,
  EvalCommand,
  RexCommand,
  RenameCommand,
  LookupCommand,
  Expression,
  SearchCondition,
} from "./types";

export interface LogRecord {
  [key: string]: unknown;
  _time?: Date;
  _raw?: string;
}

export interface ExecutionResult {
  success: boolean;
  data: LogRecord[];
  fields: string[];
  count: number;
  executionTime: number;
  error?: string;
}

export class SPLExecutor {
  private data: LogRecord[];
  private lookupTables: Map<string, LogRecord[]>;

  constructor(data: LogRecord[], lookupTables?: Map<string, LogRecord[]>) {
    this.data = data;
    this.lookupTables = lookupTables || new Map();
  }

  execute(query: string): ExecutionResult {
    const startTime = performance.now();

    try {
      const lexer = new SPLLexer(query);
      const tokens = lexer.tokenize();
      const parser = new SPLParser(tokens);
      const ast = parser.parse();

      let result = [...this.data];

      for (const command of ast.commands) {
        result = this.executeCommand(command, result);
      }

      const fields = this.extractFields(result);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        fields,
        count: result.length,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        success: false,
        data: [],
        fields: [],
        count: 0,
        executionTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
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
      case "top":
        return this.executeTop(command, data);
      case "rare":
        return this.executeRare(command, data);
      case "timechart":
        return this.executeTimechart(command, data);
      case "eval":
        return this.executeEval(command, data);
      case "rex":
        return this.executeRex(command, data);
      case "rename":
        return this.executeRename(command, data);
      case "lookup":
        return this.executeLookup(command, data);
      default:
        return data;
    }
  }

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
    // フィールド指定なしの場合は全フィールドを検索
    if (!condition.field) {
      const searchValue = String(condition.value).toLowerCase();
      for (const value of Object.values(record)) {
        if (String(value).toLowerCase().includes(searchValue)) {
          return true;
        }
      }
      // _raw フィールドも検索
      if (record._raw && String(record._raw).toLowerCase().includes(searchValue)) {
        return true;
      }
      return false;
    }

    const fieldValue = this.getFieldValue(record, condition.field);
    const conditionValue = condition.value;

    // ワイルドカード検索
    if (typeof conditionValue === "string" && conditionValue.includes("*")) {
      const regex = new RegExp(
        "^" + conditionValue.replace(/\*/g, ".*") + "$",
        "i"
      );
      return regex.test(String(fieldValue));
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
      default:
        return false;
    }
  }

  private executeWhere(command: WhereCommand, data: LogRecord[]): LogRecord[] {
    return data.filter((record) => {
      const result = this.evaluateExpression(command.expression, record);
      return Boolean(result);
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

      case "comparison": {
        const left = this.resolveValue(expr.left, record);
        const right = this.resolveValue(expr.right, record);

        switch (expr.operator) {
          case "=":
            return left == right;
          case "!=":
            return left != right;
          case ">":
            return Number(left) > Number(right);
          case ">=":
            return Number(left) >= Number(right);
          case "<":
            return Number(left) < Number(right);
          case "<=":
            return Number(left) <= Number(right);
          case "LIKE":
            const pattern = String(right).replace(/%/g, ".*");
            return new RegExp(`^${pattern}$`, "i").test(String(left));
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
        }
        return false;
      }

      default:
        return null;
    }
  }

  private evaluateFunction(name: string, args: Expression[], record: LogRecord): unknown {
    const evaluatedArgs = args.map((arg) => this.evaluateExpression(arg, record));

    switch (name.toLowerCase()) {
      case "len":
        return String(evaluatedArgs[0] || "").length;
      case "lower":
        return String(evaluatedArgs[0] || "").toLowerCase();
      case "upper":
        return String(evaluatedArgs[0] || "").toUpperCase();
      case "substr":
        return String(evaluatedArgs[0] || "").substring(
          Number(evaluatedArgs[1]) || 0,
          Number(evaluatedArgs[2]) || undefined
        );
      case "trim":
        return String(evaluatedArgs[0] || "").trim();
      case "round":
        return Math.round(Number(evaluatedArgs[0]) * Math.pow(10, Number(evaluatedArgs[1]) || 0)) /
          Math.pow(10, Number(evaluatedArgs[1]) || 0);
      case "floor":
        return Math.floor(Number(evaluatedArgs[0]));
      case "ceil":
        return Math.ceil(Number(evaluatedArgs[0]));
      case "abs":
        return Math.abs(Number(evaluatedArgs[0]));
      case "sqrt":
        return Math.sqrt(Number(evaluatedArgs[0]));
      case "pow":
        return Math.pow(Number(evaluatedArgs[0]), Number(evaluatedArgs[1]));
      case "if":
        return evaluatedArgs[0] ? evaluatedArgs[1] : evaluatedArgs[2];
      case "coalesce":
        return evaluatedArgs.find((v) => v != null) ?? null;
      case "isnull":
        return evaluatedArgs[0] == null;
      case "isnotnull":
        return evaluatedArgs[0] != null;
      case "tonumber":
        return Number(evaluatedArgs[0]);
      case "tostring":
        return String(evaluatedArgs[0]);
      case "now":
        return new Date();
      case "strftime":
        // 簡易実装
        return evaluatedArgs[1] instanceof Date
          ? evaluatedArgs[1].toISOString()
          : String(evaluatedArgs[1]);
      default:
        return null;
    }
  }

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
    return [...data].sort((a, b) => {
      for (const { field, direction } of command.fields) {
        const aVal = this.getFieldValue(a, field);
        const bVal = this.getFieldValue(b, field);

        let comparison = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private executeHead(command: HeadCommand, data: LogRecord[]): LogRecord[] {
    return data.slice(0, command.count);
  }

  private executeTail(command: TailCommand, data: LogRecord[]): LogRecord[] {
    return data.slice(-command.count);
  }

  private executeDedup(command: DedupCommand, data: LogRecord[]): LogRecord[] {
    const seen = new Set<string>();
    return data.filter((record) => {
      const key = command.fields
        .map((field) => String(this.getFieldValue(record, field)))
        .join("|");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
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

  private executeStats(command: StatsCommand, data: LogRecord[]): LogRecord[] {
    const groups = new Map<string, LogRecord[]>();

    // グループ化
    for (const record of data) {
      const groupKey =
        command.groupBy.length > 0
          ? command.groupBy
              .map((field) => String(this.getFieldValue(record, field)))
              .join("|")
          : "__all__";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    }

    // 集計
    const results: LogRecord[] = [];
    for (const [groupKey, groupRecords] of groups) {
      const result: LogRecord = {};

      // グループキーをフィールドとして追加
      if (command.groupBy.length > 0) {
        const keyValues = groupKey.split("|");
        command.groupBy.forEach((field, i) => {
          result[field] = keyValues[i];
        });
      }

      // 集計関数を適用
      for (const agg of command.aggregations) {
        const values = groupRecords.map((r) =>
          agg.field ? this.getFieldValue(r, agg.field) : null
        );
        const numericValues = values
          .filter((v) => v != null)
          .map((v) => Number(v))
          .filter((v) => !isNaN(v));

        let aggResult: unknown;
        switch (agg.function) {
          case "count":
            aggResult = groupRecords.length;
            break;
          case "sum":
            aggResult = numericValues.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            aggResult =
              numericValues.length > 0
                ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                : 0;
            break;
          case "min":
            aggResult = numericValues.length > 0 ? Math.min(...numericValues) : null;
            break;
          case "max":
            aggResult = numericValues.length > 0 ? Math.max(...numericValues) : null;
            break;
          case "dc":
            aggResult = new Set(values.map((v) => String(v))).size;
            break;
          case "values":
            aggResult = [...new Set(values.map((v) => String(v)))];
            break;
          case "list":
            aggResult = values;
            break;
          case "first":
            aggResult = values[0];
            break;
          case "last":
            aggResult = values[values.length - 1];
            break;
          case "stdev":
            if (numericValues.length > 0) {
              const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
              const variance =
                numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                numericValues.length;
              aggResult = Math.sqrt(variance);
            } else {
              aggResult = 0;
            }
            break;
          case "median":
            if (numericValues.length > 0) {
              const sorted = [...numericValues].sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              aggResult =
                sorted.length % 2 !== 0
                  ? sorted[mid]
                  : (sorted[mid - 1] + sorted[mid]) / 2;
            } else {
              aggResult = 0;
            }
            break;
          default:
            aggResult = null;
        }

        const fieldName = agg.alias || `${agg.function}(${agg.field || "*"})`;
        result[fieldName] = aggResult;
      }

      results.push(result);
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
    const results = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, command.count)
      .map(([value, count]) => ({
        [command.field]: value,
        count,
        percent: ((count / total) * 100).toFixed(2),
      }));

    return results;
  }

  private executeRare(command: RareCommand, data: LogRecord[]): LogRecord[] {
    const counts = new Map<string, number>();

    for (const record of data) {
      const value = String(this.getFieldValue(record, command.field));
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const total = data.length;
    const results = Array.from(counts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, command.count)
      .map(([value, count]) => ({
        [command.field]: value,
        count,
        percent: ((count / total) * 100).toFixed(2),
      }));

    return results;
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
      const result: LogRecord = {
        _time: new Date(bucketTime),
      };

      if (command.splitBy) {
        // Split by の場合は各値ごとに集計
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
            const aggResult = this.calculateAggregation(agg.function, values);
            result[`${splitValue}`] = aggResult;
          }
        }
      } else {
        for (const agg of command.aggregations) {
          const values = bucketRecords.map((r) =>
            agg.field ? this.getFieldValue(r, agg.field) : null
          );
          const aggResult = this.calculateAggregation(agg.function, values);
          const fieldName = agg.field ? `${agg.function}(${agg.field})` : agg.function;
          result[fieldName] = aggResult;
        }
      }

      results.push(result);
    }

    return results;
  }

  private calculateAggregation(func: string, values: unknown[]): number {
    const numericValues = values
      .filter((v) => v != null)
      .map((v) => Number(v))
      .filter((v) => !isNaN(v));

    switch (func) {
      case "count":
        return values.length;
      case "sum":
        return numericValues.reduce((a, b) => a + b, 0);
      case "avg":
        return numericValues.length > 0
          ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
          : 0;
      case "min":
        return numericValues.length > 0 ? Math.min(...numericValues) : 0;
      case "max":
        return numericValues.length > 0 ? Math.max(...numericValues) : 0;
      default:
        return 0;
    }
  }

  private parseSpan(span: string): number {
    const match = span.match(/^(\d+)([smhdwMy])$/);
    if (!match) {
      return 60 * 60 * 1000; // デフォルト1時間
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      case "w":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "M":
        return value * 30 * 24 * 60 * 60 * 1000;
      case "y":
        return value * 365 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  private executeEval(command: EvalCommand, data: LogRecord[]): LogRecord[] {
    return data.map((record) => ({
      ...record,
      [command.field]: this.evaluateExpression(command.expression, record),
    }));
  }

  private executeRex(command: RexCommand, data: LogRecord[]): LogRecord[] {
    try {
      const regex = new RegExp(command.pattern);
      return data.map((record) => {
        const fieldValue = String(this.getFieldValue(record, command.field) || "");
        const match = fieldValue.match(regex);

        if (match && match.groups) {
          return {
            ...record,
            ...match.groups,
          };
        }

        return record;
      });
    } catch {
      return data;
    }
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

  private executeLookup(command: LookupCommand, data: LogRecord[]): LogRecord[] {
    const lookupData = this.lookupTables.get(command.table);
    if (!lookupData) {
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

  private getFieldValue(record: LogRecord, field: string): unknown {
    // ドット記法に対応
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
