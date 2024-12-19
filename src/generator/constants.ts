import type { DocSection } from '@microsoft/tsdoc'

/** 文档 Front Matter 信息 */
export const FrontMatterMeta = Symbol('FrontMatter')

/** 内置默认文档片段 */
export const StandardPart = Symbol('StandardPartPart')

/** 文档可能不完整 */
export const MaybeIncomplete = Symbol('MaybeIncomplete')

export type FunctionArticlePart = Partial<Record<'parameters', DocSection>> & Record<'declare', DocSection>
