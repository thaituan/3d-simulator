import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { ReactNode } from "react";
import styles from "./SceneCanvas.module.css";

type SceneCanvasProps = {
  children?: ReactNode;
  lightColor?: string; // ライトの色（未指定時はシーン背景トークン）
  lightPower?: number; // ライトの強度（0-100%）デフォルトは100
  orbitEnabled?: boolean; // OrbitControlsの有効/無効
};

/**
 * 共通の3Dシーン Canvas コンポーネント。
 * OrbitControls と Grid を標準装備し、children で追加オブジェクトを配置できる。
 */
export default function SceneCanvas({
  children,
  lightColor,
  lightPower = 100,
  orbitEnabled = true,
}: SceneCanvasProps) {
  const rootStyles =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;

  const sceneBackground =
    rootStyles?.getPropertyValue("--color-scene-background").trim();
  const gridCellColor =
    rootStyles?.getPropertyValue("--color-grid-cell").trim();
  const gridSectionColor =
    rootStyles?.getPropertyValue("--color-grid-section").trim();

  const effectiveLightColor = lightColor ?? sceneBackground;

  return (
    <div className={styles.canvasWrapper}>
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ background: sceneBackground }}
      >
        <ambientLight
          intensity={(2 * lightPower) / 100}
          color={effectiveLightColor}
        />
        <directionalLight
          position={[-5, -8, -5]}
          intensity={0.5 * (lightPower / 100)}
          color={effectiveLightColor}
        />
        <directionalLight
          position={[5, -4, -3]}
          intensity={0.3 * (lightPower / 100)}
          color={effectiveLightColor}
        />
        <directionalLight
          position={[0, -6, 6]}
          intensity={0.2 * (lightPower / 100)}
          color={effectiveLightColor}
        />
        <OrbitControls makeDefault enabled={orbitEnabled} />
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor={gridCellColor}
          sectionSize={2}
          sectionThickness={1}
          sectionColor={gridSectionColor}
          fadeDistance={15}
          infiniteGrid
        />
        {children}
      </Canvas>
    </div>
  );
}
