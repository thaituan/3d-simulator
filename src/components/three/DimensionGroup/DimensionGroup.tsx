import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { useBoundingBox } from "@/hooks/useBoundingBox";
import DimensionArrows from "@/components/three/DimensionArrows";

type DimensionGroupProps = {
  /** 寸法線を表示するか */
  showDimensions?: boolean;
  /** 寸法線の色 */
  color?: string;
  /** 寸法線のオフセット距離（モデルからどれだけ離すか） */
  offset?: number;
  /** 計測対象の3Dオブジェクト（Model 等） */
  children: ReactNode;
};

/**
 * children を包含するバウンディングボックスを計算し、寸法線を表示する汎用コンポーネント
 *
 * 複数の children（Model 等）を渡した場合、個別ではなく全体を包含する
 * バウンディングボックスの寸法を表示する。
 *
 * 使用例:
 * ```tsx
 * <DimensionGroup showDimensions={true}>
 *   <Model productCode="xxx" position={[0, 0, 0]} />
 * </DimensionGroup>
 *
 * // 複数モデルの全体寸法
 * <DimensionGroup showDimensions={true}>
 *   <Model productCode="aaa" position={[0, 0, 0]} />
 *   <Model productCode="bbb" position={[2, 0, 0]} />
 * </DimensionGroup>
 * ```
 */
export default function DimensionGroup({
  showDimensions = false,
  color,
  offset,
  children,
}: DimensionGroupProps) {
  const groupRef = useRef<Group>(null);
  const { size, center } = useBoundingBox(groupRef);

  return (
    <group>
      <group ref={groupRef}>{children}</group>

      {showDimensions && size && center && (
        <DimensionArrows
          size={size}
          center={center}
          color={color}
          offset={offset}
        />
      )}
    </group>
  );
}
