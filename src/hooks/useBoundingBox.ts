import { useState, useRef } from "react";
import { Box3, Vector3, Object3D } from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";

type BoundingBoxResult = {
  size: Vector3 | null;
  center: Vector3 | null;
};

/**
 * 3Dオブジェクトの外接直方体（バウンディングボックス）を算出するフック
 *
 * ref で渡された group / Object3D の children 全体を包含する Box3 を計算し、
 * size（幅・高さ・奥行き）と center（中心座標）を返す。
 *
 * 複数の子オブジェクトがある場合、Box3.setFromObject() が全てを包含する
 * 最小の AABB を自動的に生成するため、個別計算は不要。
 *
 * useFrame を使い、children がシーンに追加された最初のフレームで1回だけ計算する。
 * useEffect + setState だと React 19 の effect ルールに違反するため、
 * R3F のフレームループで計算するのが安全。
 *
 * @param ref - 計測対象の Object3D への RefObject
 * @returns { size, center } — 未計算時は null
 */
export function useBoundingBox(
  ref: RefObject<Object3D | null>,
): BoundingBoxResult {
  const [size, setSize] = useState<Vector3 | null>(null);
  const [center, setCenter] = useState<Vector3 | null>(null);

  // 前回計測時の子構成シグネチャ（モデル切り替え・遅延ロード完了を検知）
  const lastMeasuredSignature = useRef<string>("");

  const getChildrenSignature = (target: Object3D): string => {
    return target.children
      .map((child) => `${child.uuid}:${child.children.length}`)
      .join("|");
  };

  useFrame(() => {
    const target = ref.current;
    if (!target) return;

    // children が scene graph に追加されるまで待つ
    // （Suspense解決後の最初のフレームで children が揃う）
    if (target.children.length === 0) return;

    const signature = getChildrenSignature(target);
    if (signature === lastMeasuredSignature.current) return;

    const box = new Box3().setFromObject(target);

    // 読み込み途中などで有効なバウンディングボックスが取れない場合は確定しない
    if (box.isEmpty()) return;

    const newSize = new Vector3();
    const newCenter = new Vector3();
    box.getSize(newSize);
    box.getCenter(newCenter);

    // 3軸すべて0近傍の場合は未ロード扱いとして再試行する
    const epsilon = 1e-6;
    const isAllZero =
      Math.abs(newSize.x) < epsilon &&
      Math.abs(newSize.y) < epsilon &&
      Math.abs(newSize.z) < epsilon;
    if (isAllZero) return;

    setSize(newSize);
    setCenter(newCenter);
    lastMeasuredSignature.current = signature;
  });

  return { size, center };
}
