/**
 * Product series UI configuration.
 *
 * Different series expose different selection axes (size, legType, armType, etc.),
 * so we define the display order and labels per series here.
 *
 * When adding a new series, just add an entry to productSeriesUiConfigMap.
 * Unregistered series are automatically excluded from the UI.
 */
export type ProductSeriesUiConfig = {
  /** name shown in dropdown (falls back to seriesId) */
  displayName?: string
  /** keys used for filtering; rendered in this order */
  selectorKeys: string[]
  /** human-friendly labels for each key */
  attributeLabels: Record<string, string>
}

/**
 * Configuration map per series.
 *
 * Series not registered here will cause getProductSeriesUiConfig to return
 * undefined and thus are omitted from the dropdown. This guards against
 * unconfigured series causing broken behavior.
 */
const productSeriesUiConfigMap: Record<string, ProductSeriesUiConfig> = {
  MS02: {
    displayName: 'MS02',
    selectorKeys: ['size', 'legType', 'armType'],
    attributeLabels: {
      size: 'Size',
      legType: 'Leg type',
      armType: 'Arm type',
    },
  },
}

/**
 * Get UI configuration for a given series ID. Returns undefined if not found.
 */
export function getProductSeriesUiConfig(seriesId: string): ProductSeriesUiConfig | undefined {
  return productSeriesUiConfigMap[seriesId]
}

/** Return display name for a series ID, defaulting to the ID if none */
export function getProductSeriesDisplayName(seriesId: string): string {
  const config = productSeriesUiConfigMap[seriesId]
  return config?.displayName ?? seriesId
}

/** Return whether a series ID is registered in the config map */
export function isProductSeriesConfigured(seriesId: string): boolean {
  return seriesId in productSeriesUiConfigMap
}
