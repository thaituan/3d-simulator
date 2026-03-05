import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, BoxSelect } from 'lucide-react' // Boxes for product, BoxSelect for simulator
import styles from './TopPage.module.css'

export default function TopPage() {
  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <p className={styles.badge}>3D Interior Experience</p>
        <h1 className={styles.heroTitle}>Design, Preview, and Simulate in 3D</h1>
        <p className={styles.heroSubtitle}>
          Explore furniture products and test room layouts with interactive 3D
          scenes.
        </p>

        <div className={styles.cardGrid}>
          <Link to="/product" className={styles.card}>
            <div className={styles.cardIcon}>
              <Boxes size={28} />
            </div>
            <span className={styles.cardTitle}>Product</span>
            <span className={styles.cardDescription}>
              Browse and compare 3D furniture models from the catalog.
            </span>
            <span className={styles.cardAction}>
              Open Product page
              <ArrowRight size={16} />
            </span>
          </Link>

          <Link to="/simulator" className={styles.card}>
            <div className={styles.cardIcon}>
              <BoxSelect size={28} />
            </div>
            <span className={styles.cardTitle}>Simulator</span>
            <span className={styles.cardDescription}>
              Place furniture in a room and test your interior arrangement.
            </span>
            <span className={styles.cardAction}>
              Open Simulator page
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}
