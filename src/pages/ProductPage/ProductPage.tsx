import { useState, Suspense } from 'react'
import R3FLoadingIndicator from '@/components/three/R3FLoadingIndicator'
import ProductSelector from '@/pages/ProductPage/ProductSelector'
import { useProductSelection } from '@/pages/ProductPage/useProductSelection'
import SimulatorLayout from '@/components/layout/SimulatorLayout'
import SceneCanvas from '@/components/three/SceneCanvas'
import SidePanel from '@/components/ui/SidePanel'
import DimensionGroup from '@/components/three/DimensionGroup'
import Model from '@/components/three/Model'
import { useModelCatalog } from '@/hooks/useModelCatalog'
import styles from '@/pages/ProductPage/ProductPage.module.css'
import selectorStyles from '@/pages/ProductPage/ProductSelector/ProductSelector.module.css'

/**
 * Product viewer page
 */
export default function ProductPage() {
  const {
    loading,
    internalError,
    selectionResult,
    configurableSeriesIds,
    effectiveSeriesId,
    seriesConfig,
    selectorKeys,
    handleSeriesChange,
    handleAttributeChange,
  } = useProductSelection()

  const { getModelPath } = useModelCatalog()
  const currentModelPath = selectionResult.matchedModel
    ? getModelPath(selectionResult.matchedModel.productCode)
    : undefined

  // state
  const [showDimensions, setShowDimensions] = useState(false)
  const [texturePath, setTexturePath] = useState<string | null>(null)
  const [showAR, setShowAR] = useState(false)
  const textures = [
    '/models/textures/MS02/fabricbeige.jpg',
    '/models/textures/MS02/fabricbrown.jpg',
    '/models/textures/MS02/fabricdarkblue.jpg',
    '/models/textures/MS02/fabricgray.jpg',
    '/models/textures/MS02/fabriclightgray.jpg',
    '/models/textures/MS02/fabricred.jpg',
    '/models/textures/MS02/MS02/fabricred2.jpg',
    '/models/textures/MS02/fabricyellow.jpg',
    '/models/textures/MS02/fabricyellowgreen.jpg',
  ]


  return (
    <>
      <SimulatorLayout
        title="Product Viewer"
        canvasContent={
        <SceneCanvas>
          <DimensionGroup showDimensions={showDimensions}>
            {!internalError && selectionResult.matchedModel ? (
              <Suspense fallback={<R3FLoadingIndicator />}>
                <Model
                  productCode={selectionResult.matchedModel.productCode}
                  position={[0, 0, 0]}
                  texturePath={texturePath || undefined}
                />
              </Suspense>
            ) : null}
          </DimensionGroup>
        </SceneCanvas>
      }
      sidePanelContent={
        <SidePanel title="Product Selection">
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Display</h3>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
              />
              <span>Show dimensions</span>
            </label>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Models</h3>
            {loading ? (
              <p className={styles.statusText}>商品情報を読み込んでいます...</p>
            ) : internalError ? (
              <p className={styles.errorText}>{internalError}</p>
            ) : (
              <ProductSelector
                configurableSeriesIds={configurableSeriesIds}
                effectiveSeriesId={effectiveSeriesId}
                seriesConfig={seriesConfig}
                selectorKeys={selectorKeys}
                selectionResult={selectionResult}
                onSeriesChange={handleSeriesChange}
                onAttributeChange={handleAttributeChange}
              />
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Texture</h3>
            <select
              className={selectorStyles.select}
              aria-label="Texture selection"
              value={texturePath || ''}
              onChange={e => setTexturePath(e.target.value || null)}
            >
              <option value="">-- none --</option>
              {textures.map(t => (
                <option key={t} value={t}>{t.split('/').pop()}</option>
              ))}
            </select>
          </div>
          <div className={styles.section}>
            <button
              className={styles.arButton}
              onClick={() => setShowAR(true)}
              disabled={!currentModelPath}
            >
              View in AR
            </button>
          </div>
        </SidePanel>
      }
    />

      {showAR && currentModelPath && (
        <div className={styles.arOverlay} onClick={() => setShowAR(false)}>
          <model-viewer
            src={currentModelPath}
            alt="Product for AR"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            environment-image="neutral"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
    </>
  )
}
