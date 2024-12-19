import { DocSection, StandardTags } from '@microsoft/tsdoc'

import type { ApiItem } from '@microsoft/api-extractor-model'

import { hasTsdocComment } from '../model/utils'
import { docBlockFilter } from '../nodes'

import type { GeneratorContext } from './types'

interface RemarksPart {
  examples?: DocSection[]
  remarks?: DocSection
}

export const genRemarkPart = (ctx: GeneratorContext, api: ApiItem): RemarksPart | undefined => {
  if (!hasTsdocComment(api)) {
    return
  }

  const part: RemarksPart = {}

  const { customBlocks, remarksBlock } = api.tsdocComment
  // Write the @remarks block
  if (remarksBlock && remarksBlock.content.nodes.length > 0) {
    part.remarks = new DocSection({ configuration: ctx.tsdocConfiguration }, remarksBlock.content.nodes)
  }

  // Write the @example blocks
  const exampleBlocks = docBlockFilter(customBlocks, StandardTags.example.tagNameWithUpperCase)
  if (exampleBlocks.length > 0) {
    part.examples = exampleBlocks.map((e) => new DocSection({ configuration: ctx.tsdocConfiguration }, e.content.nodes))
  }

  return Reflect.ownKeys(part).length > 0 ? part : undefined
}
