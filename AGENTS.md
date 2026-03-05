# AGENTS.md — 3D Simulator DevTime Lab

## プロジェクト概要

React + React Three Fiber (R3F) を用いたブラウザベースの3Dインテリアシミュレーションアプリ。
家具やインテリアの閲覧・配置シミュレーションを行う。

### 目的

- 各機能の実装にかかる時間を計測し、知見を蓄積する
- 人間が理解しながらAIと協力して進めるプロジェクト
- 丸投げではなく、学習・理解が前提

### 主要機能

| ページ               | パス    | 概要                                 |
| -------------------- | ------- | ------------------------------------ |
| トップページ         | `/`     | 2つのシミュレータへの導線            |
| ソファシミュレータ   | `/sofa` | ソファ3Dモデルの閲覧・比較           |
| お部屋コーディネート | `/room` | 部屋に家具を配置してシミュレーション |

### 将来の展望

- ソファシミュレータ → AR機能追加予定（ブラウザベース）
- コーディネートシミュレータ → VR機能追加予定（ブラウザベース）
- AR/VR関連のライブラリは現時点では含まれていない（人間が調査して追加する）

---

## 技術スタック

| カテゴリ       | 技術                               |
| -------------- | ---------------------------------- |
| フレームワーク | React 19 + TypeScript              |
| 3D             | React Three Fiber + drei           |
| ルーティング   | React Router v7                    |
| ビルドツール   | Vite 7                             |
| アイコン       | Lucide React (MIT)                 |
| スタイル       | CSS Modules + CSS Custom Props     |
| UIライブラリ   | 使用しない（学習コスト削減のため） |

---

## リポジトリ構造

```
3d-simulator-devtime-lab/
├── AGENTS.md                  # 本ファイル
├── index.html                 # エントリHTML
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── scripts/
│   └── convert-models.mjs     # FBX→GLB一括変換スクリプト(使い捨て)
├── public/                    # 静的ファイル
│   └── models/                # GLBモデル
│       ├── catalog.json       # 全モデルのメタデータ
│       ├── {productCode}.glb  # 各モデルファイル
│       └── textures/          # テクスチャ（スワップ検証用）
├── src/
│   ├── main.tsx               # エントリポイント
│   ├── App.tsx                # ルーティング定義
│   ├── index.css              # グローバルスタイル
│   ├── styles/
│   │   └── variables.css      # CSS Custom Properties（デザイントークン）
│   ├── components/
│   │   ├── layout/            # レイアウト系コンポーネント
│   │   │   ├── Header/
│   │   │   └── SimulatorLayout/
│   │   ├── three/             # R3F関連コンポーネント
│   │   │   └── SceneCanvas/
│   │   └── ui/                # 汎用UIコンポーネント
│   │       └── SidePanel/
│   ├── pages/                 # ページコンポーネント
│   │   ├── TopPage/
│   │   ├── SofaSimulator/
│   │   └── RoomCoordinator/
│   ├── hooks/                 # カスタムフック
│   ├── utils/                 # ユーティリティ関数
│   └── types/                 # 型定義
└── dist/                      # ビルド出力（gitignore対象）
```

---

## 配置ルール

### コンポーネント

- 1コンポーネント = 1ディレクトリ（コロケーション）
- ディレクトリ内に `ComponentName.tsx`, `ComponentName.module.css`, `index.ts` を配置
- `index.ts` は re-export のみ（ロジックを書かない）

```
components/ui/SidePanel/
├── SidePanel.tsx
├── SidePanel.module.css
└── index.ts          ← export { default } from './SidePanel'
```

### ファイル名

| 種別           | 命名規則          | 例                         |
| -------------- | ----------------- | -------------------------- |
| コンポーネント | PascalCase        | `SofaSimulator.tsx`        |
| CSS Module     | PascalCase.module | `SofaSimulator.module.css` |
| フック         | camelCase         | `useModelLoader.ts`        |
| ユーティリティ | camelCase         | `formatPrice.ts`           |
| 型定義         | camelCase         | `sofa.ts`                  |
| 定数           | camelCase         | `constants.ts`             |

### 配置先の判断

| 内容                           | 配置先               |
| ------------------------------ | -------------------- |
| ページ固有のコンポーネント     | `pages/PageName/` 内 |
| 2ページ以上で共有              | `components/` 配下   |
| R3Fシーン内のオブジェクト      | `components/three/`  |
| レイアウト（Header, Layout等） | `components/layout/` |
| ボタン・パネル等汎用UI         | `components/ui/`     |
| 3Dモデルファイル（GLB/GLTF）   | `public/models/`     |
| 画像                           | `public/textures/`   |

### インポート

- エイリアス `@/` を使用して絶対パスでインポートする
- 例: `import Header from '@/components/layout/Header'`

---

## 注意事項

### 全体

1. **認証機能は持たない** — 認証・ログイン機能は一切実装しない
2. **UIライブラリ禁止** — MUI, Chakra, Ant Design 等は使用しない。CSS Modulesで実装する。UIを作成する際は `docs\style-rule.md` に従い、統一されたデザインを作成する
3. **AR/VR関連ライブラリは現時点では追加しない** — 将来人間が調査して導入する
4. **アニメーション不要** — CSSアニメーション、Framer Motion等は使用しない。focus/hoverの基本的なスタイル変化のみ許可
5. **人間が理解できるコード** — 過度な抽象化を避け、明示的でシンプルなコードを書く
6. **コメント** — 「何をしているか」ではなく「なぜそうしているか」をコメントに書く。複雑なロジック・R3Fの設定値には理由を添える

### 3D (R3F) 関連

7. **Canvas は `SceneCanvas` コンポーネントを使用** — 個別に `<Canvas>` を書かない
8. **drei を活用** — コントロール、ヘルパー、ローダー等は drei のコンポーネント/フックを優先する
9. **3Dモデルは `public/models/` に GLB 形式** （デジ販から渡されたFBXを `fbx2gltf` で変換）で配置する。
10. **パフォーマンス** — 3Dシーン内のコンポーネントでは不要な再レンダリングを避ける。React.memo、useMemo を適切に使用する

### コード品質

11. **TypeScript strict モード** — `any` の使用を避ける。型は明示的に定義する
12. **ESLint エラーはゼロに保つ** — commit 前に `npm run lint` を実行する
13. **状態管理** — まずは useState / useReducer で対応。複雑になった場合のみ外部ライブラリを検討する
14. **3Dモデルメタデータ** — `public/models/catalog.json` で管理する。型定義は `src/types/model.ts` を参照。ニトリネットAPIの代替として `productCode` などをキーとしたfetchでメタデータ（商品情報）を取得させる。APIの代替なので、fetchなら初期化時の一回だけで解決できる情報取得であっても、APIだった場合と同様に都度の呼び出しを許容する

---
