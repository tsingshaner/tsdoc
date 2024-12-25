/**
 * A rgb color.
 * @example
 * With string.
 * ```ts
 * const red: RgbColor = '#f00'
 * ```
 *
 * @example
 * With number.
 * ```ts
 * const green: RgnColor = 0x0f0
 * ```
 */
export type RgbColor = `#${string}` | number

export interface DocNode {
  color: RgbColor
  kind: string
  nodes: DocNode[]
}

export type DocArticle = {
  title: string
} & DocNode
