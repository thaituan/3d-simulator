import React, { useState } from 'react'
import Header from '@/components/layout/Header'
import styles from './SimulatorLayout.module.css'

type SimulatorLayoutProps = {
  title: string
  canvasContent: React.ReactNode
  sidePanelContent: React.ReactNode
  adminPanelContent?: React.ReactNode
}

export default function SimulatorLayout({
  title,
  canvasContent,
  sidePanelContent,
  adminPanelContent,
}: SimulatorLayoutProps) {
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  return (
    <div className={styles.layout}>
      <Header
        title={title}
        showBackButton
        showAdminButton
        onAdminClick={() => setIsAdminOpen(true)}
      />

      <div className={styles.content}>
        <div className={styles.canvasArea}>
          {canvasContent}
        </div>

        <aside className={styles.sidePanel}>
          {sidePanelContent}
        </aside>
      </div>

      {isAdminOpen && (
        <>
          <div
            className={styles.adminOverlay}
            onClick={() => setIsAdminOpen(false)}
          />
          <div className={styles.adminPanel}>
            {adminPanelContent ?? (
              <AdminPanelPlaceholder onClose={() => setIsAdminOpen(false)} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AdminPanelPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)',
      }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
          Admin Tools
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          Close
        </button>
      </div>
      <p style={{ color: 'var(--color-text-light)' }}>
        Admin panel content goes here.
      </p>
    </div>
  )
}
