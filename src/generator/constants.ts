import type { DocArticle } from '@/nodes'

import type { FrontMatter } from './frontmatter-meta'
import type { StandardParts } from './types'

/** 文档 Front Matter 信息 */
export const FrontMatterMeta = Symbol('FrontMatter')

/** 内置默认文档片段 */
export const StandardPart = Symbol('StandardPartPart')

/** 文档可能不完整 */
export const MaybeIncomplete = Symbol('MaybeIncomplete')

export const getFrontMatterMeta = (article: DocArticle): FrontMatter | undefined =>
  article.meta[FrontMatterMeta] as FrontMatter | undefined

export const getStandardPart = (article: DocArticle): StandardParts | undefined => {
  return article.getPart<StandardParts>(StandardPart)
}
