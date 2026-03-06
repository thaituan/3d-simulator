import SimulatorLayout from '@/components/layout/SimulatorLayout'
import SceneCanvas from '@/components/three/SceneCanvas'
import SidePanel from '@/components/ui/SidePanel'
import Model from '@/components/three/Model'
import { useState, useRef } from 'react'
import styles from './RoomCoordinator.module.css'
import { TransformControls } from '@react-three/drei'
import type { Group } from 'three'

type SofaItem = {
  id: number
  position: [number, number, number]
  rotation?: number
}

type DraggableSofaProps = {
  sofa: SofaItem
  onTransformStart: () => void
  onTransformFinish: () => void
  onPositionCommit: (id: number, position: [number, number, number]) => void
  onSelect: (id: number) => void
}

function DraggableSofa({
  sofa,
  onTransformStart,
  onTransformFinish,
  onPositionCommit,
  onSelect,
}: DraggableSofaProps) {
  const groupRef = useRef<Group | null>(null)

  return (
    <TransformControls
      mode="translate"
      onMouseDown={onTransformStart}
      onMouseUp={() => {
        onTransformFinish()

        const obj = groupRef.current
        if (!obj) {
          return
        }

        onPositionCommit(sofa.id, [obj.position.x, obj.position.y, obj.position.z])
      }}
    >
      <group
        ref={groupRef}
        position={sofa.position}
        rotation={[0, sofa.rotation || 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect(sofa.id)
        }}
      >
        <Model productCode="2110300007864-2110300016744" />
      </group>
    </TransformControls>
  )
}

/**
 * Room coordination page
 *
 * 左側: 3D Canvas（部屋と家具の配置シミュレーション用）
 * 右側: 操作パネル（3Dモデルの追加・操作UIを追加予定）
 * ヘッダー右: 管理者ツールボタン
 */

export default function RoomCoordinator() {
  const [sofas, setSofas] = useState<SofaItem[]>([])
  const [isTransforming, setIsTransforming] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // list of room model files under public/models/room
  const roomFiles = [
    '/models/room/room.glb',
    '/models/room/room2.glb',
    '/models/room/room3.glb',
    '/models/room/room4.glb',
  ]
  const [currentRoom, setCurrentRoom] = useState<string>(
    roomFiles.length > 0 ? roomFiles[0] : '/models/room/room.glb',
  )

  const changeRoom = (path: string) => {
    setCurrentRoom(path)
    setSofas([])
    setSelectedId(null)
  }

  const handleAddSofa = () => {
    setSofas((prev) => [
      ...prev,
      { id: Date.now(), position: [0, 0, 0] },
    ])
  }

  const handleSofaPositionCommit = (id: number, position: [number, number, number]) => {
    setSofas((prev) =>
      prev.map((sofa) =>
        sofa.id === id ? { ...sofa, position } : sofa,
      ),
    )
  }

  const rotateSelected = () => {
    if (selectedId == null) return
    setSofas((prev) =>
      prev.map((sofa) =>
        sofa.id === selectedId
          ? { ...sofa, rotation: ((sofa.rotation || 0) + Math.PI / 2) % (2 * Math.PI) }
          : sofa,
      ),
    )
  }

  const duplicateSelected = () => {
    if (selectedId == null) return
    const orig = sofas.find((s) => s.id === selectedId)
    if (!orig) return
    const copy: SofaItem = {
      id: Date.now(),
      position: [orig.position[0] + 0.5, orig.position[1], orig.position[2] + 0.5],
      rotation: orig.rotation,
    }
    setSofas((prev) => [...prev, copy])
  }

  const deleteSelected = () => {
    if (selectedId == null) return
    setSofas((prev) => prev.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  return (
    <SimulatorLayout
      title="Room Coordinator"
      canvasContent={
        <SceneCanvas orbitEnabled={!isTransforming}>
          <Model modelPath={currentRoom} position={[0, 0, 0]} />
          {sofas.map((sofa) => (
            <DraggableSofa
              key={sofa.id}
              sofa={sofa}
              onTransformStart={() => setIsTransforming(true)}
              onTransformFinish={() => setIsTransforming(false)}
              onPositionCommit={handleSofaPositionCommit}
              onSelect={setSelectedId}
            />
          ))}
          {selectedId != null && (
            <group position={[0, 0, 0]}> {/* dummy to keep Canvas happy */}
            </group>
          )}
        </SceneCanvas>
      }
      sidePanelContent={
        <SidePanel title="Add Furniture">
          <div className={styles.roomSelector}>
            <label>
              Chọn phòng:
              <select
                value={currentRoom}
                onChange={(e) => changeRoom(e.target.value)}
              >
                {roomFiles.map((path) => (
                  <option key={path} value={path}>
                    {path.split('/').pop()}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button onClick={handleAddSofa}>Thêm sofa mẫu</button>
          {selectedId != null && (
            <>
              <button onClick={rotateSelected}>Xoay 90°</button>
              <button onClick={duplicateSelected}>Sao chép</button>
              <button onClick={deleteSelected}>Xóa</button>
            </>
          )}
        </SidePanel>
      }
    />
  )
}
