/**
 * Product model selector UI component.
 *
 * Renders three vertical blocks:
 *   1. series dropdown
 *   2. primary attribute buttons (e.g. size)
 *   3. secondary attribute buttons (e.g. legType, armType)
 *
 * This component is presentation-only; selection logic lives in the
 * useProductSelection hook.
 */

import { getProductSeriesDisplayName } from '../productSeriesConfig'
import type { ProductSeriesUiConfig } from '../productSeriesConfig'
import type { AttributesSelection, SelectionResult } from '../useProductSelection'
import styles from './ProductSelector.module.css'

type ProductSelectorProps = {
  /** Array of series IDs to display in dropdown */
  configurableSeriesIds: string[]
  /** Currently selected series ID */
  effectiveSeriesId: string
  /** Configuration for the current series (undefined if unregistered) */
  seriesConfig: ProductSeriesUiConfig | undefined
  /** Attribute keys used for filtering (from seriesConfig.selectorKeys) */
  selectorKeys: string[]
  /** Result from resolveSelection (options, normalized values, matched model) */
  selectionResult: SelectionResult
  /** Called when series changes */
  onSeriesChange: (seriesId: string) => void
  /** Called when an attribute value changes */
  onAttributeChange: (key: string, value: string) => void
}

export default function ProductSelector({
  configurableSeriesIds,
  effectiveSeriesId,
  seriesConfig,
  selectorKeys,
  selectionResult,
  onSeriesChange,
  onAttributeChange,
}: ProductSelectorProps) {
  const effectiveSelection: AttributesSelection =
    selectionResult.normalizedSelection

  // split selectorKeys into primary and secondary
  // primary (e.g. size) shown in block 2, others grouped in block 3
  const primarySelectorKey = selectorKeys[0]
  const secondarySelectorKeys = selectorKeys.slice(1)

  /**
   * Get a human-readable label for the given attribute key.
   * Falls back to the key itself if no label is configured.
   */
  const getLabel = (key: string): string => {
    return seriesConfig?.attributeLabels[key] ?? key
  }

  return (
    <div className={styles.selectorRoot}>
      {/* Block 1: series dropdown */}
      <section className={styles.block}>
        <label htmlFor="seriesSelect" className={styles.blockLabel}>
          Series
        </label>
        <select
          id="seriesSelect"
          className={styles.select}
          value={effectiveSeriesId}
          onChange={(event) => onSeriesChange(event.target.value)}
        >
          {configurableSeriesIds.map((seriesId) => (
            <option key={seriesId} value={seriesId}>
              {getProductSeriesDisplayName(seriesId)}
            </option>
          ))}
        </select>
      </section>

      <div className={styles.divider} />

      {/* Block 2: primary attribute buttons */}
      {primarySelectorKey ? (
        <section className={styles.block}>
          <p className={styles.blockLabel}>
            {getLabel(primarySelectorKey)}
          </p>
          <div className={styles.buttonGroup}>
            {(selectionResult.optionsByKey[primarySelectorKey] ?? []).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionButton} ${
                    effectiveSelection[primarySelectorKey] === option
                      ? styles.optionButtonActive
                      : ''
                  }`}
                  onClick={() => onAttributeChange(primarySelectorKey, option)}
                >
                  {option}
                </button>
              ),
            )}
          </div>
        </section>
      ) : null}

      <div className={styles.divider} />

      {/* Block 3: secondary attributes buttons */}
      <section className={styles.block}>
        {secondarySelectorKeys.map((key) => (
          <div key={key} className={styles.attributeGroup}>
            <p className={styles.blockLabel}>
              {getLabel(key)}
            </p>
            <div className={styles.buttonGroup}>
              {(selectionResult.optionsByKey[key] ?? []).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionButton} ${
                    effectiveSelection[key] === option
                      ? styles.optionButtonActive
                      : ''
                  }`}
                  onClick={() => onAttributeChange(key, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
