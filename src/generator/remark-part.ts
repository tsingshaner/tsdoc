import { DocSection, StandardTags } from '@microsoft/tsdoc'

import type { ApiItem } from '@microsoft/api-extractor-model'

import { hasTsdocComment } from '../model'
import { docBlockFilter } from '../nodes'

import type { GeneratorContext, RemarksPart } from './types'

export const genRemarkPart = (ctx: GeneratorContext, api: ApiItem): RemarksPart | undefined => {
  if (!hasTsdocComment(api)) {
    return
  }

  const { customBlocks, remarksBlock, summarySection } = api.tsdocComment
  const part: RemarksPart = {
    summary: summarySection
  }

  // Write the @remarks block
  if (remarksBlock && remarksBlock.content.nodes.length > 0) {
    part.remarks = new DocSection({ configuration: ctx.tsdocConfiguration }, remarksBlock.content.nodes)
  }

  // Write the @example blocks
  const exampleBlocks = docBlockFilter(customBlocks, StandardTags.example.tagNameWithUpperCase)
  if (exampleBlocks.length > 0) {
    part.examples = exampleBlocks.map((e) => new DocSection({ configuration: ctx.tsdocConfiguration }, e.content.nodes))
  }

  return part
}
