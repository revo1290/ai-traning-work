# コンポーネント設計書

## 概要

コンポーネントは以下のカテゴリに分類して管理する：

- **ui/**: 汎用UIコンポーネント（ビジネスロジックを含まない）
- **layout/**: レイアウトコンポーネント
- **features/**: 機能別コンポーネント

## ディレクトリ構成

```
src/components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── modal.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   ├── dropdown.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   ├── toast.tsx
│   └── charts/
│       ├── line-chart.tsx
│       ├── bar-chart.tsx
│       ├── pie-chart.tsx
│       └── single-value.tsx
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── main-layout.tsx
│   └── page-header.tsx
└── features/
    ├── search/
    │   ├── search-bar.tsx
    │   ├── search-results.tsx
    │   ├── field-sidebar.tsx
    │   ├── time-range-picker.tsx
    │   ├── query-history.tsx
    │   ├── saved-searches.tsx
    │   └── spl-editor.tsx
    ├── dashboard/
    │   ├── dashboard-grid.tsx
    │   ├── panel.tsx
    │   ├── panel-editor.tsx
    │   └── drilldown-modal.tsx
    ├── data/
    │   ├── upload-form.tsx
    │   ├── source-list.tsx
    │   └── sample-data-loader.tsx
    ├── alerts/
    │   ├── alert-list.tsx
    │   ├── alert-form.tsx
    │   ├── alert-history.tsx
    │   └── alert-notification.tsx
    ├── fields/
    │   ├── field-rule-list.tsx
    │   ├── field-rule-form.tsx
    │   └── rule-tester.tsx
    └── practice/
        ├── problem-list.tsx
        ├── problem-detail.tsx
        └── progress-tracker.tsx
```

---

## UIコンポーネント

### Button

```tsx
// src/components/ui/button.tsx
"use client";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  loading,
  children,
  onClick,
  type = "button",
  className
}: ButtonProps): JSX.Element
```

### Input

```tsx
// src/components/ui/input.tsx
"use client";

interface InputProps {
  type?: "text" | "number" | "password" | "email";
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Input(props: InputProps): JSX.Element
```

### Select

```tsx
// src/components/ui/select.tsx
"use client";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select(props: SelectProps): JSX.Element
```

### Card

```tsx
// src/components/ui/card.tsx

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function Card({ title, children, className, actions }: CardProps): JSX.Element
```

### Table

```tsx
// src/components/ui/table.tsx
"use client";

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T>(props: TableProps<T>): JSX.Element
```

### Modal

```tsx
// src/components/ui/modal.tsx
"use client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

export function Modal(props: ModalProps): JSX.Element
```

### Tabs

```tsx
// src/components/ui/tabs.tsx
"use client";

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element
```

### Tooltip

```tsx
// src/components/ui/tooltip.tsx
"use client";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip(props: TooltipProps): JSX.Element
```

### Charts

#### LineChart

```tsx
// src/components/ui/charts/line-chart.tsx
"use client";

interface DataPoint {
  x: string | number;
  y: number;
}

interface Series {
  name: string;
  data: DataPoint[];
  color?: string;
}

interface LineChartProps {
  series: Series[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
  onPointClick?: (point: DataPoint, seriesName: string) => void;
}

export function LineChart(props: LineChartProps): JSX.Element
```

#### BarChart

```tsx
// src/components/ui/charts/bar-chart.tsx
"use client";

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  orientation?: "vertical" | "horizontal";
  height?: number;
  showValues?: boolean;
  onBarClick?: (item: { label: string; value: number }) => void;
}

export function BarChart(props: BarChartProps): JSX.Element
```

#### PieChart

```tsx
// src/components/ui/charts/pie-chart.tsx
"use client";

interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showLegend?: boolean;
  donut?: boolean;
  onSliceClick?: (item: { label: string; value: number }) => void;
}

export function PieChart(props: PieChartProps): JSX.Element
```

#### SingleValue

```tsx
// src/components/ui/charts/single-value.tsx

interface SingleValueProps {
  value: number | string;
  label?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  format?: (value: number | string) => string;
}

export function SingleValue(props: SingleValueProps): JSX.Element
```

---

## レイアウトコンポーネント

### MainLayout

アプリケーション全体のレイアウト。

```tsx
// src/components/layout/main-layout.tsx

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): JSX.Element
```

構成:
- Header（上部）
- Sidebar（左）
- Main Content（中央）

### Header

```tsx
// src/components/layout/header.tsx
"use client";

export function Header(): JSX.Element
```

要素:
- ハンバーガーメニュー（サイドバー開閉）
- ロゴ
- グローバル検索バー
- 時間範囲セレクター
- テーマ切り替えボタン（ライト/ダーク）
- 通知アイコン
- ヘルプアイコン

### Sidebar

```tsx
// src/components/layout/sidebar.tsx
"use client";

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar(props: SidebarProps): JSX.Element
```

機能:
- 開閉可能（ハンバーガーメニューから切り替え）
- アニメーション付きの幅変更
- 折りたたみ時はアイコンのみ表示

ナビゲーション項目:
- ホーム
- 検索
- ダッシュボード
- データ取り込み
- アラート
- フィールド抽出
- 練習問題
- 設定

### PageHeader

ページ上部のタイトル・アクションエリア。

```tsx
// src/components/layout/page-header.tsx

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader(props: PageHeaderProps): JSX.Element
```

---

## 機能コンポーネント

### 検索機能

#### SPLEditor

SPLクエリ入力エディタ。構文ハイライト、エラー表示、オートコンプリートを提供。

```tsx
// src/components/features/search/spl-editor.tsx
"use client";

interface SPLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
  error?: { message: string; position?: number };
  height?: number;
  placeholder?: string;
}

export function SPLEditor(props: SPLEditorProps): JSX.Element
```

機能:
- 構文ハイライト
- エラー箇所のハイライト
- コマンドのオートコンプリート
- コマンドヘルプのツールチップ
- Ctrl+Enter で実行

#### SearchBar

検索画面のメインコンポーネント。

```tsx
// src/components/features/search/search-bar.tsx
"use client";

interface SearchBarProps {
  onSearch: (query: string, timeRange: TimeRange) => void;
  loading?: boolean;
  initialQuery?: string;
}

export function SearchBar(props: SearchBarProps): JSX.Element
```

構成:
- SPLEditor
- 実行ボタン
- 保存ボタン
- テンプレート選択

#### SearchResults

検索結果表示。

```tsx
// src/components/features/search/search-results.tsx
"use client";

interface SearchResultsProps {
  data: LogRecord[];
  fields: string[];
  loading?: boolean;
  onExport?: (format: "csv" | "json") => void;
  onVisualize?: () => void;
}

export function SearchResults(props: SearchResultsProps): JSX.Element
```

表示モード:
- テーブル（デフォルト）
- 生ログ
- 可視化

#### TimeRangePicker

時間範囲選択。

```tsx
// src/components/features/search/time-range-picker.tsx
"use client";

interface TimeRange {
  from: number;
  to: number;
  preset?: string;
}

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangePicker(props: TimeRangePickerProps): JSX.Element
```

プリセット:
- 過去15分
- 過去1時間
- 過去4時間
- 過去24時間
- 過去7日
- カスタム

#### FieldSidebar

フィールド一覧サイドバー。

```tsx
// src/components/features/search/field-sidebar.tsx
"use client";

interface FieldSidebarProps {
  fields: Array<{ name: string; count: number; type: string }>;
  selectedFields: string[];
  onFieldSelect: (field: string) => void;
  onFieldDeselect: (field: string) => void;
}

export function FieldSidebar(props: FieldSidebarProps): JSX.Element
```

---

### ダッシュボード機能

#### DashboardGrid

パネルのグリッドレイアウト。ドラッグ&ドロップで並び替え可能。

```tsx
// src/components/features/dashboard/dashboard-grid.tsx
"use client";

interface DashboardGridProps {
  panels: Panel[];
  editMode: boolean;
  onLayoutChange?: (layout: PanelPosition[]) => void;
  onPanelEdit?: (panelId: string) => void;
  onPanelDelete?: (panelId: string) => void;
  onPanelDrilldown?: (panelId: string, data: unknown) => void;
}

export function DashboardGrid(props: DashboardGridProps): JSX.Element
```

#### Panel

ダッシュボードパネル。

```tsx
// src/components/features/dashboard/panel.tsx
"use client";

interface PanelProps {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "table" | "single";
  query: string;
  config?: PanelConfig;
  editMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDrilldown?: (data: unknown) => void;
}

export function Panel(props: PanelProps): JSX.Element
```

#### PanelEditor

パネル作成・編集モーダル。

```tsx
// src/components/features/dashboard/panel-editor.tsx
"use client";

interface PanelEditorProps {
  panel?: Panel;  // 編集時に渡される
  open: boolean;
  onClose: () => void;
  onSave: (panel: Partial<Panel>) => void;
}

export function PanelEditor(props: PanelEditorProps): JSX.Element
```

機能:
- パネルの新規作成
- 既存パネルの編集
- タイトル、SPLクエリ、可視化タイプの設定
- リアルタイムプレビュー（オプション）

---

### データ取り込み機能

#### UploadForm

ファイルアップロードフォーム。

```tsx
// src/components/features/data/upload-form.tsx
"use client";

interface UploadFormProps {
  onUpload: (result: UploadResult) => void;
}

export function UploadForm(props: UploadFormProps): JSX.Element
```

機能:
- ドラッグ&ドロップ
- ファイル選択
- フォーマット自動検出
- プレビュー表示
- アップロード進捗

#### SampleDataLoader

サンプルデータ読み込み。

```tsx
// src/components/features/data/sample-data-loader.tsx
"use client";

interface SampleDataLoaderProps {
  onLoad: (type: string, count: number) => void;
}

export function SampleDataLoader(props: SampleDataLoaderProps): JSX.Element
```

---

### アラート機能

#### AlertForm

アラート作成・編集フォーム。

```tsx
// src/components/features/alerts/alert-form.tsx
"use client";

interface AlertFormProps {
  alert?: Alert;
  onSave: (alert: Partial<Alert>) => void;
  onCancel: () => void;
}

export function AlertForm(props: AlertFormProps): JSX.Element
```

フィールド:
- アラート名
- SPLクエリ（SPLEditorを使用）
- 条件（>, <, =, !=, >=, <=）
- 閾値
- 有効/無効

#### AlertNotification

アラート通知トースト。

```tsx
// src/components/features/alerts/alert-notification.tsx
"use client";

interface AlertNotificationProps {
  alerts: TriggeredAlert[];
  onDismiss: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function AlertNotification(props: AlertNotificationProps): JSX.Element
```

---

### 練習問題機能

#### ProblemDetail

問題詳細・回答画面。

```tsx
// src/components/features/practice/problem-detail.tsx
"use client";

interface ProblemDetailProps {
  problem: Problem;
  progress?: PracticeProgress;
  onSubmit: (query: string) => void;
  onHint: () => void;
}

export function ProblemDetail(props: ProblemDetailProps): JSX.Element
```

構成:
- 問題文
- 期待される結果のプレビュー
- SPLEditor
- 提出ボタン
- ヒントボタン
- フィードバック表示

---

## スタイリング方針

### カラーパレット

#### ダークテーマ（デフォルト）

```css
:root {
  /* Background */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3d3d3d;
  --bg-hover: #454545;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-muted: #808080;

  /* Accent */
  --accent-primary: #5cc05c;    /* Splunk Green */
  --accent-secondary: #f2b705;  /* Warning Yellow */
  --accent-danger: #d94f4f;     /* Error Red */
  --accent-info: #5b9bd5;       /* Info Blue */

  /* Border */
  --border-color: #404040;
  --border-light: #505050;
}
```

#### ライトテーマ

```css
[data-theme="light"] {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e8e8e8;
  --bg-hover: #e0e0e0;

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #737373;

  /* Accent */
  --accent-primary: #2d9a2d;
  --accent-secondary: #c78f00;
  --accent-danger: #c92a2a;
  --accent-info: #3b7bb5;

  /* Border */
  --border-color: #d0d0d0;
  --border-light: #e0e0e0;
}
```

### コンポーネントのスタイリング

- Tailwind CSSを使用
- カスタムテーマでSplunk風の色を定義
- コンポーネントはclassNameプロップで追加スタイルを受け入れる

---

## 状態管理

### グローバル状態

Zustand を使用（localStorage に永続化）：

```typescript
// src/lib/store/index.ts
interface AppState {
  // UI設定
  theme: "light" | "dark";
  sidebarCollapsed: boolean;

  // データ
  sources: LogSource[];
  logs: RawLog[];
  isDataLoaded: boolean;

  // 検索
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  currentSearchResult: ExecutionResult | null;

  // ダッシュボード
  dashboards: Dashboard[];

  // アラート
  alerts: Alert[];
  alertHistory: AlertHistoryItem[];

  // フィールド
  fieldExtractions: FieldExtraction[];

  // 練習問題
  practiceProgress: PracticeProgress[];

  // アクション
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // ... その他のアクション
}
```

### ローカル状態

- フォームの入力値
- モーダルの開閉
- 一時的なUI状態

---

## アクセシビリティ

- キーボードナビゲーション対応
- ARIA属性の適切な使用
- フォーカス管理
- コントラスト比の確保
