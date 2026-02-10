# CalcStages

小学生向け計算ドリルアプリ (React + Vite)

## Startup
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173` (default Vite port)

## Tech Stack
- Vite
- React
- React Router Dom
- Tailwind CSS

## File Structure
- `public/curriculum/`: カリキュラムJSON
- `src/lib/generator/`: 問題生成ロジック
- `src/pages/`: 画面コンポーネント (Home, Stages, PlayPage)
- `src/context/`: 状態管理 (GameContext)

## How to Add Curriculum
1. `public/curriculum/` に新しいJSONを作成 (例: `es_g1_sub.json`)。
2. `src/types/curriculum.ts` の `PoolType` に新しいタイプが必要なら追加。
3. `src/lib/generator/math.ts` に生成関数を追加。
4. `src/lib/generator/index.ts` の `generateQuestionsForStage` で分岐に追加。
