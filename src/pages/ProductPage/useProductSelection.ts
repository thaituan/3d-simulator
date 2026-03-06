import { useState, useMemo } from 'react'
import { useModelCatalog } from '@/hooks/useModelCatalog'
import type { ModelEntry } from '@/types'
import {
  getProductSeriesUiConfig,
  isProductSeriesConfigured,
} from './productSeriesConfig'
import type { ProductSeriesUiConfig } from './productSeriesConfig'

// ============================================================
// 型定義
// ============================================================

/**
 * Dictionary holding the user's selection for each attribute key.
 *
 * We use a Record instead of fixed fields so different series with
 * different axes can be handled uniformly.
 *
 * Example: { size: "2P", legType: "High", armType: "Slim" }
 */
export type AttributesSelection = Record<string, string>

/**
 * resolveSelection の返り値。
 * Contains the options per key, normalized selection values, and the
 * filtered result model passed to the UI.
 */
export type SelectionResult = {
  /** option list for each attribute key (order follows selectorKeys) */
  optionsByKey: Record<string, string[]>
  /** normalized selection values after auto-correction
   * (if current value is unavailable in new options, fall back to first) */
  normalizedSelection: AttributesSelection
  /** The model resulting from filtering. If multiple remain due to
 * attributes outside selectorKeys, the first is chosen. */
  matchedModel: ModelEntry | null
}

// ============================================================
// ユーティリティ関数
// ============================================================

/** 配列から重複を除いた値を返す（出現順を維持） */
function uniqueValues(values: string[]): string[] {
  return [...new Set(values)]
}

/**
 * Filter out models that are missing attributes required by
 * selectorKeys.
 *
 * This guard prevents malformed catalog entries from polluting
 * the option generation for other models.
 *
 * Excluded models are logged with console.warn to help catch issues early.
 */
function filterValidModels(
  models: ModelEntry[],
  selectorKeys: string[],
): ModelEntry[] {
  return models.filter((model) => {
    const missingKeys = selectorKeys.filter(
      (key) => model.attributes[key] === undefined || model.attributes[key] === '',
    )

    if (missingKeys.length > 0) {
      console.warn(
        `[ProductPage] Model ${model.productCode} missing attributes [${missingKeys.join(', ')}]; excluded from options`,
      )
      return false
    }

    return true
  })
}

/**
 * Iterate through selectorKeys in order, returning options per key
 * and the ultimately matched model.
 *
 * Filtering flow (e.g. selectorKeys = ['size','legType','armType']):
 *   1. derive size options from models → filter by user selection
 *   2. derive legType options from remaining models → filter
 *   3. derive armType options from remaining models → filter
 *
 * At each stage the current user choice is kept if available, otherwise
 * the first option is selected automatically to maintain continuity.
 *
 * If multiple models remain due to attributes outside selectorKeys
 * (e.g. color), the first one is chosen. A color picker UI may be added later.
 */
function resolveSelection(
  models: ModelEntry[],
  selectorKeys: string[],
  currentSelection: AttributesSelection,
): SelectionResult {
  const optionsByKey: Record<string, string[]> = {}
  const normalizedSelection: AttributesSelection = {}
  let filtered = models

  for (const key of selectorKeys) {
    // 現在の絞り込み結果から、このキーの選択肢をユニーク抽出
    const options = uniqueValues(
      filtered
        .map((model) => model.attributes[key])
        .filter((value): value is string => value !== undefined),
    )

    optionsByKey[key] = options

    if (options.length === 0) {
      continue
    }

    // ユーザーの選択値が候補に含まれていれば維持、なければ先頭へ自動補正
    const selectedValue = currentSelection[key]
    const normalizedValue = options.includes(selectedValue)
      ? selectedValue
      : options[0]

    normalizedSelection[key] = normalizedValue
    filtered = filtered.filter((model) => model.attributes[key] === normalizedValue)
  }

  // selectorKeys 以外の属性差（例: color）で複数残る場合は先頭を採用
  const matchedModel = filtered.length >= 1 ? filtered[0] : null

  return {
    optionsByKey,
    normalizedSelection,
    matchedModel,
  }
}

// ============================================================
// フック本体
// ============================================================

/**
 * Custom hook managing selection state for the product page.
 *
 * Responsibilities:
 *  - extract product models from catalog.json
 *  - expose only series registered in productSeriesConfig.ts
 *  - hold user selection state (series & attributes)
 *  - auto-correct selections when options change
 *  - return a filtered model based on the selection
 *
 * The UI component (ProductSelector) merely renders the data returned by
 * this hook; it contains no selection logic.
 *
 * The implementation separates derived data (options), current selection,
 * and normalization to make future migration to useReducer easier.
 */
export function useProductSelection() {
  const { catalog, loading, error } = useModelCatalog()
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [selectedAttributes, setSelectedAttributes] =
    useState<AttributesSelection>({})

  // --- extract product models from catalog ---
  const productModels = useMemo(
    () => (catalog?.models ?? []).filter((model) => model.category === 'sofa'),
    [catalog],
  )

  // --- generate series candidates ---

  // all series IDs from catalog (including unconfigured ones)
  const allSeriesIds = useMemo(
    () => uniqueValues(productModels.map((model) => model.seriesId)),
    [productModels],
  )

  // only display series registered in productSeriesConfig.ts
  // unregistered series are excluded to avoid selectorKeys mismatch issues,
  // with a console warning emitted as a safety measure.
  const configurableSeriesIds = useMemo(() => {
    const configured: string[] = []

    for (const id of allSeriesIds) {
      if (isProductSeriesConfigured(id)) {
        configured.push(id)
      } else {
        console.warn(
          `[ProductPage] Series "${id}" is not registered in productSeriesConfig.ts and was excluded`,
        )
      }
    }

    return configured
  }, [allSeriesIds])

  // --- determine effective series ID ---
  // use user-chosen series if still a candidate; otherwise fall back to first
  const effectiveSeriesId =
    selectedSeriesId && configurableSeriesIds.includes(selectedSeriesId)
      ? selectedSeriesId
      : configurableSeriesIds[0] ?? ''

  // --- obtain series configuration ---
  const seriesConfig = useMemo<ProductSeriesUiConfig | undefined>(
    () => getProductSeriesUiConfig(effectiveSeriesId),
    [effectiveSeriesId],
  )

  // seriesConfig undefined means unregistered series (shouldn't happen due to filter)
  // wrap in useMemo to avoid new array on each render which would destabilize deps
  const selectorKeys = useMemo(
    () => seriesConfig?.selectorKeys ?? [],
    [seriesConfig],
  )

  // --- filter models within selected series ---
  const seriesModels = useMemo(
    () =>
      productModels.filter(
        (model) => !effectiveSeriesId || model.seriesId === effectiveSeriesId,
      ),
    [effectiveSeriesId, productModels],
  )

  // exclude models missing attributes required by selectorKeys (data sanity guard)
  const validModels = useMemo(
    () => filterValidModels(seriesModels, selectorKeys),
    [seriesModels, selectorKeys],
  )

  // --- generate options and normalize selection ---
  const selectionResult = useMemo(
    () => resolveSelection(validModels, selectorKeys, selectedAttributes),
    [validModels, selectorKeys, selectedAttributes],
  )

  // --- determine internal error ---
  // guard for data issues or missing config, not normally reached by user actions
  const internalError = useMemo(() => {
    if (loading) {
      return null
    }

    if (error) {
      return 'Failed to load catalog.'
    }

    if (productModels.length === 0) {
      return 'No product models found.'
    }

    if (configurableSeriesIds.length === 0) {
      return 'No valid series configuration found. Please register series in productSeriesConfig.ts.'
    }

    if (!effectiveSeriesId || seriesModels.length === 0) {
      return 'No models found for the selected series.'
    }

    if (selectorKeys.length === 0) {
      return 'Series configuration invalid.'
    }

    if (validModels.length === 0) {
      return 'No valid model data for this series. Check catalog.json attribute definitions.'
    }

    if (!selectionResult.matchedModel) {
      return 'Failed to narrow down to a model.'
    }

    return null
  }, [
    configurableSeriesIds.length,
    error,
    loading,
    selectorKeys.length,
    effectiveSeriesId,
    selectionResult.matchedModel,
    seriesModels.length,
    productModels.length,
    validModels.length,
  ])

  // --- event handlers ---

  /** When series changes: reset attributes to default for new series */
  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    setSelectedAttributes({})
  }

  /** 属性変更時: 指定キーの値だけを更新する（他のキーはそのまま維持） */
  const handleAttributeChange = (key: string, value: string) => {
    setSelectedAttributes((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return {
    /** カタログ読み込み中かどうか */
    loading,
    /** 内部エラーメッセージ（正常時は null） */
    internalError,
    /** Filtering result (options list, normalized values, matched model) */
    selectionResult,
    /** series options shown in UI (only configured ones) */
    configurableSeriesIds,
    /** currently effective series ID */
    effectiveSeriesId,
    /** effective series configuration (undefined if unregistered) */
    seriesConfig,
    /** 絞り込みに使用する属性キーの配列 */
    selectorKeys,
    /** handler invoked when series changes */
    handleSeriesChange,
    /** 属性変更ハンドラ */
    handleAttributeChange,
  }
}
