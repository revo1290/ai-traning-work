"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ExecutionResult } from "@/lib/spl/types";
import { LogRecord } from "@/lib/spl/executor";

interface SearchResultChartProps {
  result: ExecutionResult;
}

// Helper to determine chart type and data keys
interface ChartConfig {
  type: "line" | "bar" | "pie" | "table"; // Added table as fallback
  xAxisKey?: string;
  dataKey?: string;
  dataKeys?: string[]; // For multiple lines/bars
  nameKey?: string; // For pie chart
  valueKey?: string; // For pie chart
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function getChartConfig(result: ExecutionResult): ChartConfig {
  if (!result.data || result.data.length === 0) {
    return { type: "table" }; // Fallback to table if no data
  }

  const firstRecord = result.data[0];
  const fields = result.fields;

  // Timechart detection
  if (fields.includes("_time") && fields.length > 1) {
    const valueFields = fields.filter(f => f !== "_time" && typeof firstRecord[f] === 'number');
    if (valueFields.length > 0) {
      return {
        type: "line",
        xAxisKey: "_time",
        dataKeys: valueFields,
      };
    }
  }

  // Stats command results (e.g., `stats count by host`)
  // Detects if there's one categorical field and one numeric field (typically 'count' or an aggregation)
  if (fields.length === 2) {
    const [field1, field2] = fields;
    const isField1String = typeof firstRecord[field1] === 'string' || typeof firstRecord[field1] === 'boolean';
    const isField2Number = typeof firstRecord[field2] === 'number';

    if (isField1String && isField2Number) {
      // Bar chart for categorical data vs number
      return {
        type: "bar",
        xAxisKey: field1,
        dataKey: field2,
      };
    }
  }

  // Fallback for general aggregations that might be suitable for bar/pie if one dataKey is clear
  if (fields.length > 1) {
    const numericFields = fields.filter(f => typeof firstRecord[f] === 'number');
    const nonNumericFields = fields.filter(f => typeof firstRecord[f] === 'string' || typeof firstRecord[f] === 'boolean');

    if (nonNumericFields.length === 1 && numericFields.length === 1) {
      return {
        type: "bar",
        xAxisKey: nonNumericFields[0],
        dataKey: numericFields[0],
      };
    } else if (nonNumericFields.length > 0 && numericFields.length === 1) {
      // Pie chart if there's one category and one value (e.g., top 5 status)
      // We'll use the first non-numeric field as the name key and the first numeric as the value key
      return {
        type: "pie",
        nameKey: nonNumericFields[0],
        valueKey: numericFields[0],
      };
    }
  }

  return { type: "table" }; // Default to table if no specific chart type is detected
}

const SearchResultChart: React.FC<SearchResultChartProps> = ({ result }) => {
  if (!result.success || !result.data || result.data.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--text-muted)]">
        表示するデータがありません。
      </div>
    );
  }

  const chartConfig = getChartConfig(result);

  if (chartConfig.type === "table") {
    return (
      <div className="p-4 text-center text-[var(--text-muted)]">
        このデータは現在チャートで表示できません。イベントタブをご覧ください。
      </div>
    );
  }

  const data = result.data.map((record: LogRecord) => {
    // Format _time for Recharts XAxis if present
    if (chartConfig.xAxisKey === "_time" && record._time instanceof Date) {
      return {
        ...record,
        _time: record._time.toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return record;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      {chartConfig.type === "line" && chartConfig.xAxisKey && chartConfig.dataKeys ? (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={chartConfig.xAxisKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} itemStyle={{ color: 'var(--text-primary)' }} />
          <Legend />
          {chartConfig.dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      ) : chartConfig.type === "bar" && chartConfig.xAxisKey && chartConfig.dataKey ? (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={chartConfig.xAxisKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} itemStyle={{ color: 'var(--text-primary)' }} />
          <Legend />
          <Bar dataKey={chartConfig.dataKey} fill={COLORS[0]} />
        </BarChart>
      ) : chartConfig.type === "pie" && chartConfig.nameKey && chartConfig.valueKey ? (
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey={chartConfig.valueKey}
            nameKey={chartConfig.nameKey}
            label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} itemStyle={{ color: 'var(--text-primary)' }} />
          <Legend />
        </PieChart>
      ) : (
        <div className="p-4 text-center text-[var(--text-muted)]">
          このデータは現在チャートで表示できません。イベントタブをご覧ください。
        </div>
      )}
    </ResponsiveContainer>
  );
};

export default SearchResultChart;
