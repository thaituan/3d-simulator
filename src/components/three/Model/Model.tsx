import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useModelCatalog } from "@/hooks/useModelCatalog";

/**
 * GLB形式の3Dモデルを表示する汎用コンポーネント
 *
 * 使い方:
 * 1. 商品コード指定: <Model productCode="2110300007321-2110300016843" />
 * 2. パス直接指定: <Model modelPath="/models/glb/xxx.glb" />
 *
 * パス直接指定は商品コードがつかないオブジェクトを自由に動かしたいときのために残している。
 * 例: 棚を自由に移動できるNクリックなどのシミュレーションや、ドアや窓の生成。
 * ただし、そういった要件の時にはパス直接指定ではなく、このModel関数自体を拡張し、
 * ドアや窓の管理コードを渡す仕組みにするほうが良いかもしれない。
 *
 * productCode が指定された場合、catalog.json(将来的にはAPI)から自動的にmodelPathを解決する。
 *
 * useGLTF:
 * - @react-three/drei が提供するGLTF/GLBローダー
 * - 自動的にキャッシュを行い、同じモデルを複数回読み込まない
 * - Three.js の GLTFLoader をラップしている
 *
 * primitive:
 * - Three.js のオブジェクト（gltf.scene）をReactコンポーネントとして扱うためのR3Fコンポーネント
 * - object prop に Three.js オブジェクトを渡す
 * - position, scale, rotation などの標準的なTransform propsが使える
 */

type ModelProps = {
  /** 商品コード（catalog.json から modelPath を自動解決） */
  productCode?: string;
  /** GLBファイルのパス（直接指定する場合） */
  modelPath?: string;
  /** 配置位置 [x, y, z] （デフォルト: 原点） */
  position?: [number, number, number];
  /** Y軸回転（ラジアン, デフォルト: 0） */
  rotation?: number;
  /** テクスチャパスを上書き */
  texturePath?: string;
};

/**
 * パス解決ゲート: productCode → modelPath の解決とローディング制御を担当。
 * パスが確定したら ModelRenderer に委譲する。
 *
 * useGLTF（React Hook）を early return の後に呼べないため、
 * 「パス解決」と「GLBロード＋描画」をコンポーネント分割で解決している。
 */
export default function Model({
  productCode,
  modelPath,
  position = [0, 0, 0],
  rotation = 0,
  texturePath,
}: ModelProps) {
  const { getModelPath, loading } = useModelCatalog();

  // productCode が指定された場合、カタログから modelPath を取得
  // modelPath が直接指定された場合はそれを使用
  const resolvedPath = productCode ? getModelPath(productCode) : modelPath;

  // productCode 指定時はカタログの読み込み完了を待つ必要がある
  // modelPath 直接指定時はカタログを参照しないので loading を待たない
  if (!resolvedPath || (productCode && loading)) {
    return null;
  }

  return (
    <ModelRenderer
      modelPath={resolvedPath}
      position={position}
      rotation={rotation}
      texturePath={texturePath}
    />
  );
}

// ============================================================
// 内部コンポーネント
// ============================================================

type ModelRendererProps = {
  modelPath: string;
  position: [number, number, number];
  rotation: number;
  texturePath?: string;
};

/**
 * GLBロード＋描画を担当する内部コンポーネント。
 *
 * modelPath は確定済みの状態でのみ呼ばれるため、
 * useGLTF を無条件で呼べる（Hooks ルール違反なし）。
 *
 * gltf.scene.clone() で独立コピーを作成するのは、
 * Three.js のオブジェクトは1つの親にしか所属できないため。
 * useGLTF はキャッシュを共有するので、同じモデルの <Model> が複数あると
 * 後からマウントされた方が scene を奪い、先にマウントされた方が消える。
 * clone() で各インスタンスに独立コピーを持たせることでこれを防ぐ。
 *
 * dispose={null} を指定する理由:
 * .clone() は shallow clone であり、geometry/material は元のキャッシュと共有している。
 * R3F はコンポーネントアンマウント時に自動 dispose を実行するが、
 * これが共有 geometry/material まで破棄すると、他のインスタンスや再表示時にモデルが壊れる。
 * dispose={null} で自動 dispose を無効化し、リソースは useGLTF のキャッシュ管理に委ねる。
 * これにより、同じモデルを複数配置してもメモリ効率を保ちつつ安全に動作する。
 */
function ModelRenderer({ modelPath, position, rotation, texturePath }: ModelRendererProps & { texturePath?: string }) {
  const gltf = useGLTF(modelPath);

  // モデルパスが変わり、gltf.sceneが変更されたときだけ clone を再計算する
  const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  // texture application
  const texture = useMemo(() => {
    if (!texturePath) return null;
    const loader = new THREE.TextureLoader();
    return loader.load(texturePath);
  }, [texturePath]);

  useMemo(() => {
    if (texture) {
      clonedScene.traverse((node) => {
        // @ts-ignore
        if (node.isMesh && node.material) {
          // @ts-ignore
          node.material.map = texture;
          // @ts-ignore
          node.material.needsUpdate = true;
        }
      });
    }
  }, [clonedScene, texture]);

  return (
    <primitive
      object={clonedScene}
      dispose={null}
      position={position}
      rotation={[0, rotation, 0]}
    />
  );
}
