import { DocSection, StandardTags } from '@microsoft/tsdoc'

import type { ApiItem } from '@microsoft/api-extractor-model'

import { hasTsdocComment } from '../model'
import { docBlockFilter } from '../nodes'
import { DocArticle } from '../nodes/custom-nodes/article'
import { FrontMatterMeta, StandardPart } from './constants'
import { genArticleFrontMatter } from './frontmatter-meta'
import { genRemarkPart } from './remark-part'
import { genSignaturePart } from './signature-part'
import { genTablesPart } from './table-part'

import type { GeneratorContext, GeneratorOptions, HandlerParameters, StandardParts } from './types'

const defaultArticleInitializer: GeneratorOptions['articleInitializer'] = ({ tsdocConfiguration }, api) =>
  new DocArticle({
    configuration: tsdocConfiguration,
    meta: {
      [FrontMatterMeta]: genArticleFrontMatter(api)
    }
  })

const defaultArticleGenerator = (...[ctx, api, options]: HandlerParameters) => {
  const article = options.articleInitializer(ctx, api, options)
  const configuration = ctx.tsdocConfiguration
  const subApis: ApiItem[] = []

  const parts: StandardParts = {}

  if (hasTsdocComment(api)) {
    parts.remarks = genRemarkPart(ctx, api)

    const decorators = docBlockFilter(api.tsdocComment.customBlocks, StandardTags.decorator.tagNameWithUpperCase)
    if (decorators.length > 0) {
      parts.decorators = new DocSection({ configuration }, decorators)
    }

    if (api.tsdocComment.deprecatedBlock) {
      parts.deprecated = new DocSection({ configuration }, api.tsdocComment.deprecatedBlock.content.nodes)
    }
  }

  parts.signature = genSignaturePart(ctx, api)

  const tables = genTablesPart(ctx, api)
  if (tables) {
    parts.tables = tables.part as StandardParts['tables']
    article.mergeMeta(tables.meta ?? {})
    subApis.push(...(tables.subApis ?? []))
  }

  article.addPart(StandardPart, parts)

  return { article, subApis }
}

function* articleGenerator(ctx: GeneratorContext, apis: ApiItem[], options: GeneratorOptions): Generator<DocArticle> {
  const subApis: ApiItem[] = []

  for (const api of apis) {
    const res = options.generator(ctx, api, options)

    yield res.article

    subApis.push(...res.subApis)
  }

  if (subApis.length > 0) {
    yield* articleGenerator(ctx, subApis, options)
  }
}

export type { GeneratorContext, GeneratorOptions, HandlerParameters }
export { articleGenerator, defaultArticleGenerator, defaultArticleInitializer }
