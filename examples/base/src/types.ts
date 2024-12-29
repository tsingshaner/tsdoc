import type { ReleaseTag } from './enums'

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
  kind: string
  nodes: DocNode[]
}

export interface DocTag extends DocNode {
  color: RgbColor
}

export type Release = ReleaseTag

export interface DocReleaseTag extends DocTag, DocNode {
  release: Release
}

export type DocArticle = {
  title: string
} & DocNode
