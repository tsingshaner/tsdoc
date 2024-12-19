import type { ApiItem, ApiModel } from '@microsoft/api-extractor-model'
import type { TSDocConfiguration } from '@microsoft/tsdoc'

import type { ArticlePart, DocArticle } from '../nodes/custom-nodes/article'

interface GeneratorContext {
  model: ApiModel
  tsdocConfiguration: TSDocConfiguration
}

type HandlerParameters = [ctx: GeneratorContext, api: ApiItem, options: GeneratorOptions]
type ArticleGenerator = (...args: HandlerParameters) => {
  article: DocArticle
  subApis: ApiItem[]
}

interface GeneratorOptions {
  articleInitializer: (...args: HandlerParameters) => DocArticle
  generator: ArticleGenerator
}

export interface GenerateResult<
  T extends ArticlePart = ArticlePart,
  M extends Record<string | symbol, unknown> = Record<string | symbol, unknown>
> {
  meta?: M
  part?: T
  subApis?: ApiItem[]
}

export type { ArticleGenerator, GeneratorContext, GeneratorOptions, HandlerParameters }
