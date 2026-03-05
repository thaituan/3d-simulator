/**
 * 3Dモデルカタログの型定義
 *
 * このファイルは public/models/catalog.json の構造を定義する。
 * 今回はニトリネットAPIからの商品情報を取得しないが、連携したときのことを考慮し、
 * 商品コードなどから商品情報を取得したり、カテゴリコード（本来は小分類コード）などから
 * 商品を絞り込めるようにしている
 */

/**
 * 商品カテゴリ
 *
 * 本来は小分類コードを使うべきだが、3D関連技術の習得という目的からは外れているため、
 * 仮のカテゴリを定義している。
 * 
 * UIでカテゴリ別に表示する際のフィルタキーとして使用する。
 * 新しい商品種別が増えたらここにリテラル型を追加すること。
 */
export type ProductCategory =
  | 'sofa'
  | 'dining-table'
  | 'sideboard'
  | 'dining-chair'
  | 'kitchen-board';

/**
 * 3Dモデル1つ分のメタデータ
 *
 * 商品固有の属性（サイズ・色・肘タイプなど）は attributes に格納する。
 * attributes を Record<string, string> にすることで、
 * ソファ・テーブル・キッチンボードなど商品種別ごとに
 * 異なるキーを柔軟に持てるようにしている。
 * 
 * このあたりも、本来であればニトリネットAPIのレスポンスを使う。
 * あくまで学習用の仮設定
 *
 * 例:
 * - ソファ → { size: "2P", legType: "ハイタイプ", armType: "ワイド肘", color: "LGY" }
 * - サイドボード → { size: "80", color: "LBR" }
 * - キッチンボード → { size: "90", color: "WH", unitType: "上台" }
 */
export interface ModelEntry {
  /** 商品コード（一意キー）。MS02は2コードをハイフン繋ぎで使用 
   * 7桁や13桁のバリデーションにはできないので注意。
  */
  productCode: string;

  /**
   * シリーズID（例: "MS02", "MM05", "TD301"）
   * UIでシリーズごとにグループ表示・フィルタリングする際に使用する
   * 
   * これも本来はニトリネットAPIがどのようなレスポンスを返すかによる
   */
  seriesId: string;

  /** GLBファイルへのパス（publicルートからの絶対パス） */
  modelPath: string;

  /** UI上に表示する商品名 */
  displayName: string;

  /**
   * 商品カテゴリ
   * カテゴリ別の一覧UIや、シミュレータごとの表示切替に使用する
   */
  category: ProductCategory;

  /**
   * 商品固有の属性（可変キー）
   *
   * 商品種別によってキーが異なるため Record<string, string> としている。
   * 主要なキーは以下の通り:
   * - size: サイズ（"2P", "3P", "80", "120", "135" など）
   * - color: カラーコード（"LGY", "BE", "LBR" など）
   * - legType: 脚タイプ（"ハイタイプ", "ロータイプ", "標準タイプ"）※ソファのみ
   * - armType: 肘タイプ（"スリム肘", "ミドル肘", "ワイド肘"）※ソファのみ
   */
  attributes: Record<string, string>;
}

/**
 * 全モデルのカタログ
 *
 * public/models/catalog.json をfetchして取得するデータの型。
 * このデータは本来はAPIレスポンスだが、今回はダミーを用いる。
 */
export interface ModelCatalog {
  /** 全モデルエントリの配列 */
  models: ModelEntry[];
}
