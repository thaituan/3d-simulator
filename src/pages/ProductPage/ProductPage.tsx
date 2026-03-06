import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
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
  const [arHint, setArHint] = useState<string | null>(null)
  const [iosUsdAvailable, setIosUsdAvailable] = useState<boolean | null>(null)
  const modelViewerRef = useRef<HTMLElement | null>(null)

  const isIOSDevice = useMemo(() => {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }, [])

  const iosSrc = useMemo(() => {
    if (!currentModelPath || !currentModelPath.endsWith('.glb')) return undefined
    // convert "/models/glb/xxx.glb" -> "/models/usdz/xxx.usdz"
    let url = currentModelPath.replace(/\.glb$/i, '.usdz')
    url = url.replace(/\/models\/glb\//, '/models/usdz/')
    return url
  }, [currentModelPath])

  useEffect(() => {
    if (!isIOSDevice) {
      setIosUsdAvailable(null)
      return
    }

    if (!iosSrc) {
      setIosUsdAvailable(false)
      return
    }

    let active = true
    setIosUsdAvailable(null)

    fetch(iosSrc, { method: 'HEAD' })
      .then((response) => {
        if (!active) return
        setIosUsdAvailable(response.ok)
      })
      .catch(() => {
        if (!active) return
        setIosUsdAvailable(false)
      })

    return () => {
      active = false
    }
  }, [isIOSDevice, iosSrc])

  useEffect(() => {
    if (!showAR) return

    if (!window.isSecureContext) {
      setArHint('AR cần HTTPS khi mở từ điện thoại trong cùng mạng LAN. Hãy chạy qua HTTPS/tunnel rồi thử lại.')
      return
    }

    setArHint(null)
  }, [showAR])

  useEffect(() => {
    const viewer = modelViewerRef.current
    if (!viewer) return

    const handleArStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ status?: string }>
      const status = customEvent.detail?.status

      if (status === 'failed') {
        setArHint('Không thể mở AR trên thiết bị này. Trên iPhone cần file .usdz, trên Android cần Scene Viewer/WebXR khả dụng.')
      }
    }

    viewer.addEventListener('ar-status', handleArStatus)
    return () => viewer.removeEventListener('ar-status', handleArStatus)
  }, [showAR, currentModelPath])
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
              onClick={() => {
                if (isIOSDevice && iosUsdAvailable === false) {
                  setArHint('Thiết bị iOS cần file .usdz tương ứng để mở AR. Hiện model này chưa có file .usdz khả dụng.')
                  return
                }
                setArHint(null)
                setShowAR(true)
              }}
              disabled={!currentModelPath || (isIOSDevice && iosUsdAvailable === false)}
            >
              View in AR
            </button>
            <p className={styles.arHelpText}>
              Android: cần Google Scene Viewer/WebXR. iPhone/iPad: dùng Quick Look và bắt buộc có file .usdz.
            </p>
          </div>
        </SidePanel>
      }
    />

      {showAR && currentModelPath && (
        <div className={styles.arOverlay}>
          <div
            className={styles.arViewerContainer}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.arCloseButton}
              onClick={() => setShowAR(false)}
            >
              Close
            </button>
            <model-viewer
              ref={modelViewerRef as never}
              src={currentModelPath}
              ios-src={isIOSDevice ? iosSrc : undefined}
              alt="Product for AR"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-placement="floor"
              ar-scale="auto"
              camera-controls
              environment-image="neutral"
              style={{ width: '100%', height: '100%' }}
            >
              <button slot="ar-button" className={styles.arLaunchButton}>
                Start AR
              </button>
            </model-viewer>
            {arHint ? <p className={styles.arHintText}>{arHint}</p> : null}
          </div>
        </div>
      )}
    </>
  )
}
