import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'
import styles from './Header.module.css'

type HeaderProps = {
  title: string
  showBackButton?: boolean
  showAdminButton?: boolean
  onAdminClick?: () => void
}

export default function Header({
  title,
  showBackButton = false,
  showAdminButton = false,
  onAdminClick,
}: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        {showBackButton && (
          <button
            className={styles.backButton}
            onClick={() => navigate('/')}
            aria-label="トップページに戻る"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actions}>
        {showAdminButton && onAdminClick && (
          <button className={styles.adminButton} onClick={onAdminClick}>
            <Settings size={18} />
            <span className={styles.adminButtonText}>Admin Tools</span>
          </button>
        )}
      </div>
    </header>
  )
}
