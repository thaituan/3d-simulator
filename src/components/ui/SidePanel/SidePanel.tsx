import styles from './SidePanel.module.css'

type SidePanelProps = {
  title: string
  children?: React.ReactNode
}

/**
 * シミュレータ右側の操作パネル。
 * title でパネル見出しを表示し、children で操作UIを差し込む。
 */
export default function SidePanel({ title, children }: SidePanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {children ?? (
        <p className={styles.placeholder}>
          ここに操作パネルが追加されます。
        </p>
      )}
    </div>
  )
}
