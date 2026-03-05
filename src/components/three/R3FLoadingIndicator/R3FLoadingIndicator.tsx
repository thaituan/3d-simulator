import { Html } from '@react-three/drei'
import { LoaderCircle } from 'lucide-react'
import styles from './R3FLoadingIndicator.module.css'

/**
 * R3FのCanvas内でのみ使用するローディングフォールバック。
 * @react-three/drei の Html を内包し、3Dシーン上に2D UIを重ねて表示する。
 */
export default function R3FLoadingIndicator() {
  return (
    <Html center>
      <div className={styles.spinner} role="status" aria-label="読み込み中">
        <LoaderCircle className={styles.spinnerIcon} aria-hidden="true" />
      </div>
    </Html>
  )
}
