/**
 * FBX → GLB 一括変換スクリプト
 * 
 * 3Dモデルを用意するときに使用しました。
 * 一応、ここから先のコメントに書いてあるようにフォルダ名などのルールを守ればパース処理は使いまわせますが、
 * コード自体を修正させたほうが早いとは思います。
 * 
 *
 * temp/3dModel/ にFBXファイルを配置してからこのスクリプトを実行すると、
 * public/models/ にGLB形式で変換されたモデルが出力されます。
 * 
 * MS02（組み合わせソファ）用とそれ以外用でパース処理やロジックが分かれています。
 * MS02以外は、「3000594 サイドボード(MM05 120 LBR)/3000594.fbx」のように名前を付けてtempフォルダに入れてもらえればOKです。
 * 
 * ただし、新規のカテゴリの商品を追加する場合は70~80行目あたりのCATEGORY_MAPにカテゴリ判定のキーワードとカテゴリIDを追加する必要があります。
 * 
 * MS02はパターンわけが複雑で、フォルダ構造を他のテーブルなどとは変えていたため、メタデータ抽出のロジックを分けています。
 *
 * temp/3dModel/ にあるFBXファイルを public/models/ にGLB形式で変換・配置する。
 * すでにGLB形式のファイルはそのままコピーする。
 * 変換完了後、全モデルのメタデータを catalog.json として出力する。
 *
 * 使い方: npm run convert-models
 *
 * なぜGLBか:
 * - テクスチャを1ファイルに埋め込めるため管理がシンプル
 * - React Three Fiber の useGLTF (drei) でそのまま読み込める
 * - 将来S3に配置する際も1ファイルのアップロードで済む
 * - そもそもRITTAIもGLB形式にモデルを変換している
 *
 * なぜFBX2glTFか:
 * - Facebook(Meta)が開発した実績のあるツール
 * - npmパッケージ (fbx2gltf) として手軽に使える
 * - テクスチャの自動埋め込みに対応している
 */

import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { join, resolve, extname, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// fbx2gltf は CommonJS モジュールなので dynamic import で読み込む
import convert from 'fbx2gltf';

// __dirname の代替（ESModulesでは __dirname が使えないため）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// 入出力ディレクトリ
const TEMP_DIR = join(PROJECT_ROOT, 'temp', '3dModel');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'models');
// place GLB assets in a subfolder so runtime can reference /models/glb/
const GLB_DIR = join(OUTPUT_DIR, 'glb');
const TEXTURES_DIR = join(OUTPUT_DIR, 'textures', 'MS02');

// ─── MS02ソファのカラーコード一覧 ───
// フォルダ名末尾のカラーコードを識別するために使用する
const MS02_COLOR_CODES = ['LGY', 'MGY', 'BE', 'BR', 'RE', 'YE', 'YGR', 'DBL'];

// MS02のファブリック色テクスチャファイル名（テクスチャスワップ検証用に収集する）
const MS02_FABRIC_TEXTURES = [
  'fabriclightgray.jpg',
  'fabricgray.jpg',
  'fabricbeige.jpg',
  'fabricbrown.jpg',
  'fabricred.jpg',
  'fabricred2.jpg',
  'fabricyellow.jpg',
  'fabricyellowgreen.jpg',
  'fabricdarkblue.jpg',
];

/**
 * ─── otherモデルのカテゴリ判定 ───
 *
 * フォルダに含まれる日本語の商品名からカテゴリを判定する。
 * 新しい商品種別が増えたらここにマッピングを追加すること。
 */
const CATEGORY_MAP = {
  'ダイニングテーブル': 'dining-table',
  'サイドボード': 'sideboard',
  'ダイニングチェア': 'dining-chair',
  'キッチンボード': 'kitchen-board',
};

// ──────────────────────────────
// ユーティリティ関数
// ──────────────────────────────

/**
 * ディレクトリが存在しなければ再帰的に作成する
 */
async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * 指定ディレクトリ内のサブディレクトリ一覧を取得する
 */
async function getSubDirs(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * 指定ディレクトリ内の特定拡張子のファイルを取得する
 */
async function getFilesByExt(dirPath, ext) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && extname(e.name).toLowerCase() === ext)
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// ──────────────────────────────
// MS02 ソファモデルのパース
// ──────────────────────────────

/**
 * MS02モデルのフォルダ構造からメタデータを抽出する
 *
 * フォルダ構造:
 *   MS02/{size}/{legType}-{armType}/{productCode} {description}
 *
 * 例:
 *   MS02/2P/ハイタイプ-スリム肘/2110300007864-2110300016744 ハイ-スリム-YGR
 *   → size: "2P", legType: "ハイタイプ", armType: "スリム肘", color: "YGR"
 */
async function parseMS02Models() {
  const ms02Dir = join(TEMP_DIR, 'MS02');
  const models = [];

  // サイズ（2P / 3P）
  const sizes = await getSubDirs(ms02Dir);

  for (const size of sizes) {
    const sizeDir = join(ms02Dir, size);

    // タイプ（ハイタイプ-スリム肘 など）
    const types = await getSubDirs(sizeDir);

    for (const typeName of types) {
      const typeDir = join(sizeDir, typeName);

      // 「ハイタイプ-スリム肘」→ legType(脚タイプ): "ハイタイプ", armType: "スリム肘"
      // 親フォルダ名を使う（モデルフォルダの説明は省略形で不統一なため）
      const [legType, armType] = typeName.split('-');

      // 各モデルフォルダ
      const modelDirs = await getSubDirs(typeDir);

      for (const modelDirName of modelDirs) {
        const modelDir = join(typeDir, modelDirName);

        // フォルダ名から商品コードと説明を分離
        // 例: "2110300007864-2110300016744 ハイ-スリム-YGR"
        //   → productCode: "2110300007864-2110300016744"
        //   → description: "ハイ-スリム-YGR"
        const spaceIndex = modelDirName.indexOf(' ');
        const productCode = modelDirName.substring(0, spaceIndex);
        const description = modelDirName.substring(spaceIndex + 1);

        // 説明の末尾からカラーコードを抽出する
        // "ハイ-スリム-YGR" → "YGR"
        // "標準-スリム" → ""（カラーコードなし）
        const descParts = description.split('-');
        const lastPart = descParts[descParts.length - 1];
        const color = MS02_COLOR_CODES.includes(lastPart) ? lastPart : '';

        // FBXファイルを探す
        const fbxFiles = await getFilesByExt(modelDir, '.fbx');
        if (fbxFiles.length === 0) {
          console.warn(`  ⚠ FBXファイルが見つかりません: ${modelDir}`);
          continue;
        }

        const displayName = `MS02 ${size} ${legType} ${armType}${color ? ' ' + color : ''}`;

        models.push({
          productCode,
          seriesId: 'MS02',
          category: 'sofa',
          displayName,
          attributes: {
            size,
            legType,
            armType,
            ...(color ? { color } : {}),
          },
          // 変換元のファイルパス（変換処理で使用）
          sourcePath: join(modelDir, fbxFiles[0]),
          sourceType: 'fbx',
          // テクスチャフォルダのパス（テクスチャ収集で使用）
          textureDir: join(modelDir, 'texture'),
        });
      }
    }
  }

  return models;
}

// ──────────────────────────────
// otherモデルのパース
// ──────────────────────────────

/**
 * other/フォルダの各モデルからメタデータを抽出する
 *
 * フォルダ名のパターン:
 *   "{productCode} {商品名}({seriesId} {size} {color})"
 *   "{productCode} {商品名}({seriesId} {color})"  ← サイズなしの場合
 *
 * 例:
 *   "3000591 サイドボード(MM05 80 LBR)"
 *   → productCode: "3000591", seriesId: "MM05", size: "80", color: "LBR"
 *
 *   "4000323 ダイニングチェア(TD301 DGY)"
 *   → productCode: "4000323", seriesId: "TD301", color: "DGY"
 */
async function parseOtherModels() {
  const otherDir = join(TEMP_DIR, 'other');
  const models = [];
  const modelDirs = await getSubDirs(otherDir);

  for (const dirName of modelDirs) {
    const modelDir = join(otherDir, dirName);

    // フォルダ名をパースする
    // "3000591 サイドボード(MM05 80 LBR)" を分解
    const spaceIndex = dirName.indexOf(' ');
    const productCode = dirName.substring(0, spaceIndex);
    const rest = dirName.substring(spaceIndex + 1);

    // 括弧内の情報を取り出す
    // "サイドボード(MM05 80 LBR)" → itemName: "サイドボード", parenContent: "MM05 80 LBR"
    const parenMatch = rest.match(/^(.+?)\((.+)\)$/);
    if (!parenMatch) {
      console.warn(`  ⚠ フォルダ名をパースできません: ${dirName}`);
      continue;
    }

    const itemName = parenMatch[1]; // "サイドボード" or "ダイニングテーブル(半円形" の場合もある

    // 括弧が入れ子の場合は最も外側の括弧を使う
    // "ダイニングテーブル(半円形SJ604 135 LBR)" → rest全体を再パース
    const outerParenMatch = rest.match(/^(.+)\(([^)]+)\)$/);
    const parenContent = outerParenMatch ? outerParenMatch[2] : parenMatch[2];
    const displayPrefix = outerParenMatch ? outerParenMatch[1] : parenMatch[1];

    // 括弧内をスペースで分割: ["MM05", "80", "LBR"] or ["TD301", "DGY"]
    const parts = parenContent.split(/\s+/);

    // シリーズIDは英数字部分のみを使用する
    // 「半円形SJ604」のように日本語の形状説明が前についている場合があるため、
    // 末尾の英数字部分だけを抽出する
    const seriesIdMatch = parts[0].match(/([A-Z0-9]+)$/i);
    const seriesId = seriesIdMatch ? seriesIdMatch[1] : parts[0];

    // カテゴリを日本語名から判定
    let category = 'other';
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (displayPrefix.includes(keyword)) {
        category = cat;
        break;
      }
    }

    // parts が3個以上ならサイズあり（例: ["MM05", "80", "LBR"]）
    // parts が2個ならサイズなし（例: ["TD301", "DGY"]）
    const attributes = {};
    if (parts.length >= 3) {
      attributes.size = parts[1];
      attributes.color = parts[parts.length - 1];
    } else if (parts.length === 2) {
      attributes.color = parts[1];
    }

    const displayName = `${displayPrefix}(${parenContent})`;

    // FBXまたはGLBファイルを探す
    const fbxFiles = await getFilesByExt(modelDir, '.fbx');
    const glbFiles = await getFilesByExt(modelDir, '.glb');

    let sourcePath, sourceType;
    if (glbFiles.length > 0) {
      // すでにGLB形式の場合はそのままコピー
      sourcePath = join(modelDir, glbFiles[0]);
      sourceType = 'glb';
    } else if (fbxFiles.length > 0) {
      sourcePath = join(modelDir, fbxFiles[0]);
      sourceType = 'fbx';
    } else {
      console.warn(`  ⚠ 3Dモデルファイルが見つかりません: ${modelDir}`);
      continue;
    }

    models.push({
      productCode,
      seriesId,
      category,
      displayName,
      attributes,
      sourcePath,
      sourceType,
    });
  }

  return models;
}

// ──────────────────────────────
// 変換処理
// ──────────────────────────────

/**
 * FBXファイルをGLBに変換する、またはGLBファイルをコピーする
 *
 * @param {object} model - パースされたモデル情報
 * @returns {string} 出力先のファイルパス
 */
async function convertOrCopy(model) {
  const outputFileName = `${model.productCode}.glb`;
  const outputPath = join(GLB_DIR, outputFileName);


  if (model.sourceType === 'glb') {
    // すでにGLB形式ならそのままコピー
    await copyFile(model.sourcePath, outputPath);
    return outputPath;
  }

  // FBX → GLB 変換
  // fbx2gltf は出力パスの拡張子が .glb ならバイナリ(GLB)形式で出力する
  try {
    await convert(model.sourcePath, outputPath);
    return outputPath;
  } catch (error) {
    console.error(`  ✗ 変換失敗: ${model.productCode} — ${error.message || error}`);
    return null;
  }
}

// ──────────────────────────────
// テクスチャ収集（MS02テクスチャスワップ検証用）
// ──────────────────────────────

/**
 * MS02モデルのテクスチャフォルダからファブリック色テクスチャを収集し、
 * public/models/textures/MS02/ にコピーする。
 *
 * 同じファイル名が複数のバリアントに存在するが、
 * 色名が同じなら中身は同一なので重複はスキップする。
 */
async function collectMS02Textures(ms02Models) {
  await ensureDir(TEXTURES_DIR);
  const copiedFiles = new Set();

  for (const model of ms02Models) {
    if (!model.textureDir || !existsSync(model.textureDir)) continue;

    const files = await readdir(model.textureDir);
    for (const file of files) {
      const lower = file.toLowerCase();
      // ファブリック色テクスチャのみを対象にする
      if (MS02_FABRIC_TEXTURES.includes(lower) && !copiedFiles.has(lower)) {
        const src = join(model.textureDir, file);
        const dest = join(TEXTURES_DIR, lower);
        await copyFile(src, dest);
        copiedFiles.add(lower);
      }
    }
  }

  return copiedFiles.size;
}

// ──────────────────────────────
// catalog.json 生成
// ──────────────────────────────

/**
 * 全モデルのメタデータから catalog.json を生成する
 *
 * このJSONはアプリ側から fetch('/models/catalog.json') で取得する。
 * 将来APIに移行する際は、このfetchをAPI呼び出しに置き換えるだけで済む。
 */
function buildCatalog(models) {
  return {
    models: models.map((m) => ({
      productCode: m.productCode,
      seriesId: m.seriesId,
      modelPath: `/models/glb/${m.productCode}.glb`,
      displayName: m.displayName,
      category: m.category,
      attributes: m.attributes,
    })),
  };
}

// ──────────────────────────────
// メイン処理
// ──────────────────────────────

async function main() {
  console.log('🔧 3Dモデル変換を開始します...\n');

  // 出力ディレクトリの準備
  await ensureDir(OUTPUT_DIR);
  await ensureDir(GLB_DIR);

  // ── Step 1: モデル情報のパース ──
  console.log('📂 モデル情報をパース中...');
  const ms02Models = await parseMS02Models();
  const otherModels = await parseOtherModels();
  const allModels = [...ms02Models, ...otherModels];
  console.log(`  MS02: ${ms02Models.length}モデル, other: ${otherModels.length}モデル`);
  console.log(`  合計: ${allModels.length}モデル\n`);

  // ── Step 2: FBX → GLB 変換 ──
  console.log('🔄 FBX → GLB 変換中...');
  let successCount = 0;
  let failCount = 0;
  let copyCount = 0;

  for (const model of allModels) {
    const action = model.sourceType === 'glb' ? 'コピー' : '変換';
    process.stdout.write(`  ${action}: ${model.productCode} ... `);

    const result = await convertOrCopy(model);
    if (result) {
      if (model.sourceType === 'glb') {
        copyCount++;
      } else {
        successCount++;
      }
      console.log('✓');
    } else {
      failCount++;
      console.log('✗');
    }
  }

  console.log(`\n  変換成功: ${successCount}, コピー: ${copyCount}, 失敗: ${failCount}\n`);

  // ── Step 3: MS02テクスチャ収集 ──
  console.log('🎨 MS02テクスチャを収集中...');
  const textureCount = await collectMS02Textures(ms02Models);
  console.log(`  ${textureCount}個のファブリックテクスチャを textures/MS02/ にコピーしました\n`);

  // ── Step 4: catalog.json 生成 ──
  console.log('📋 catalog.json を生成中...');
  // 変換に失敗したモデルは除外する
  const successModels = allModels.filter((m) => {
    const outputPath = join(GLB_DIR, `${m.productCode}.glb`);
    return existsSync(outputPath);
  });
  const catalog = buildCatalog(successModels);
  const catalogPath = join(OUTPUT_DIR, 'catalog.json');
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`  ${successModels.length}エントリを catalog.json に出力しました\n`);

  // ── 完了 ──
  console.log('✅ 変換完了！');
  if (failCount > 0) {
    console.log(`⚠ ${failCount}件の変換に失敗しました。上記のエラーを確認してください。`);
  }
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
