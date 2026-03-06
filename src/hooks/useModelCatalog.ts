import React from "react";
import type { ModelCatalog } from "@/types";

/**
 * モデルカタログを読み込み、商品コードからモデル情報を取得するフック
 * 
 * catalog.json の読み込み:
 * - public/models/catalog.json を fetch で取得
 * - 初回のみ読み込み、以降は state にキャッシュ
 * 
 * 商品コード検索:
 * - models 配列から productCode が一致するものを find で検索
 */

export function useModelCatalog() {
  const [catalog, setCatalog] = React.useState<ModelCatalog | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // catalog.json を fetch で読み込み
    fetch("/models/catalog.json")
      .then((res) => {
        if (!res.ok) throw new Error("カタログの読み込みに失敗しました");
        return res.json();
      })
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []); // 空配列 = 初回マウント時のみ実行

  /**
   * 商品コードから modelPath を取得
   *
   * @param productCode - 商品コード（例: "2110300007321-2110300016843"）
   * @returns modelPath（例: "/models/xxx.glb"）または undefined
   */
  const getModelPath = (productCode: string): string | undefined => {
    if (!catalog) return undefined;

    // models 配列から商品コードが一致するものを検索
    const model = catalog.models.find((m) => m.productCode === productCode);
    return model?.modelPath;
  };

  return { catalog, loading, error, getModelPath };
}