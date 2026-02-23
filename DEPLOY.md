# デプロイ手順

## Vercel へのデプロイ

このプロジェクトはモノレポ構造です。Next.js アプリは `ai-traning-work/` ディレクトリにあります。

### 設定手順

1. [Vercel Dashboard](https://vercel.com/dashboard) でプロジェクトをインポート
2. **Settings → General → Root Directory** で `ai-traning-work` を指定
3. その他の設定はデフォルトのままでデプロイ可能です

Root Directory を `ai-traning-work` に設定すると、Vercel はそのディレクトリをプロジェクトルートとして `npm install` と `npm run build` を実行します。

### ルートディレクトリを使う場合

Root Directory を指定せずリポジトリルートを使用する場合は、ルートの `vercel.json` のカスタムコマンドが適用されます。
