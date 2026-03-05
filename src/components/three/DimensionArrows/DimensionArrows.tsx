import { Line, Html } from "@react-three/drei";
import { Vector3 } from "three";

type DimensionArrowsProps = {
  /** バウンディングボックスのサイズ [x, y, z] */
  size: Vector3;
  /** バウンディングボックスの中心位置 [x, y, z] */
  center: Vector3;
  /** 矢印の色 */
  color?: string;
  /** オフセット距離（モデルからどれだけ離すか） */
  offset?: number;
};

/**
 * 3Dモデルの寸法を矢印とテキストで表示するコンポーネント
 *
 * x軸（幅）、y軸（高さ）、z軸（奥行き）それぞれに寸法線を描画
 * Three.jsの座標系: Y軸が上方向、X軸が右方向、Z軸が手前方向
 *
 * 寸法の単位: モデルの単位系に依存（通常メートル）
 * 表示は cm 単位に変換（×100）
 */
export default function DimensionArrows({
  size,
  center,
  color = "#696969",
  offset = 0.1,
}: DimensionArrowsProps) {
  const halfSize = {
    x: size.x / 2,
    y: size.y / 2,
    z: size.z / 2,
  };

  // 寸法をcm単位に変換（モデルの単位がメートルと仮定）
  const formatDimension = (value: number) => {
    const cm = Math.round(value * 100);
    return `${cm}cm`;
  };

  // X軸（幅）の寸法線: モデルの前面下部に配置
  const xLineY = center.y - halfSize.y;
  const xLineZ = center.z + halfSize.z + offset;

  // Y軸（高さ）の寸法線: モデルの右側前面に配置
  const yLineX = center.x + halfSize.x + offset;
  const yLineZ = center.z - halfSize.z - offset;

  // Z軸（奥行き）の寸法線: モデルの右側下部に配置
  const zLineX = center.x + halfSize.x + offset;
  const zLineY = center.y - halfSize.y;

  return (
    <group>
      {/* X軸（幅）の寸法線 */}
      <group>
        {/* 水平線 */}
        <Line
          points={[
            [center.x - halfSize.x, xLineY, xLineZ],
            [center.x + halfSize.x, xLineY, xLineZ],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 両端の垂直マーク */}
        <Line
          points={[
            [center.x - halfSize.x, xLineY, xLineZ - 0.05],
            [center.x - halfSize.x, xLineY, xLineZ + 0.05],
          ]}
          color={color}
          lineWidth={2}
        />
        <Line
          points={[
            [center.x + halfSize.x, xLineY, xLineZ - 0.05],
            [center.x + halfSize.x, xLineY, xLineZ + 0.05],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 寸法テキスト */}
        <Html position={[center.x, xLineY, xLineZ + 0.1]} center>
          <div
            style={{
              color,
              fontSize: "14px",
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
              whiteSpace: "nowrap",
            }}
          >
            幅: {formatDimension(size.x)}
          </div>
        </Html>
      </group>

      {/* Y軸（高さ）の寸法線 */}
      <group>
        {/* 垂直線 */}
        <Line
          points={[
            [yLineX, center.y - halfSize.y, yLineZ],
            [yLineX, center.y + halfSize.y, yLineZ],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 両端の水平マーク */}
        <Line
          points={[
            [yLineX - 0.05, center.y - halfSize.y, yLineZ],
            [yLineX + 0.05, center.y - halfSize.y, yLineZ],
          ]}
          color={color}
          lineWidth={2}
        />
        <Line
          points={[
            [yLineX - 0.05, center.y + halfSize.y, yLineZ],
            [yLineX + 0.05, center.y + halfSize.y, yLineZ],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 寸法テキスト */}
        <Html position={[yLineX + 0.1, center.y, yLineZ]} center>
          <div
            style={{
              color,
              fontSize: "14px",
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
              whiteSpace: "nowrap",
            }}
          >
            高さ: {formatDimension(size.y)}
          </div>
        </Html>
      </group>

      {/* Z軸（奥行き）の寸法線 */}
      <group>
        {/* 奥行き線 */}
        <Line
          points={[
            [zLineX, zLineY, center.z - halfSize.z],
            [zLineX, zLineY, center.z + halfSize.z],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 両端の垂直マーク */}
        <Line
          points={[
            [zLineX - 0.05, zLineY, center.z - halfSize.z],
            [zLineX + 0.05, zLineY, center.z - halfSize.z],
          ]}
          color={color}
          lineWidth={2}
        />
        <Line
          points={[
            [zLineX - 0.05, zLineY, center.z + halfSize.z],
            [zLineX + 0.05, zLineY, center.z + halfSize.z],
          ]}
          color={color}
          lineWidth={2}
        />
        {/* 寸法テキスト */}
        <Html position={[zLineX + 0.1, zLineY, center.z]} center>
          <div
            style={{
              color,
              fontSize: "14px",
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
              whiteSpace: "nowrap",
            }}
          >
            奥行き: {formatDimension(size.z)}
          </div>
        </Html>
      </group>
    </group>
  );
}
