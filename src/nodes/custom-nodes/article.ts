import { DocNode, DocSection, type IDocNodeDefinition, type IDocSectionParameters } from '@microsoft/tsdoc'

import { customNode } from '../decorator'

const mergeMeta = (
  source: Record<string | symbol, unknown>,
  patch: Record<string | symbol, unknown>
): Record<string | symbol, unknown> => {
  for (const key in patch) {
    if (patch[key] === undefined) {
      continue
    }

    if (source[key] instanceof Object) {
      source[key] = mergeMeta(
        source[key] as Record<string | symbol, unknown>,
        patch[key] as Record<string | symbol, unknown>
      )
    } else if (Array.isArray(source[key]) && Array.isArray(patch[key])) {
      source[key].push(...(patch[key] as unknown[]))
    } else {
      source[key] = patch[key]
    }
  }

  return source
}

const isArticlePart = (part: unknown): part is ArticlePart => !(part instanceof DocSection) && part instanceof Object
const mergePart = (source: ArticlePart, patch: ArticlePart): ArticlePart => {
  for (const key in patch) {
    if (patch[key] === undefined) {
      continue
    }

    if (Array.isArray(source[key]) && Array.isArray(patch[key])) {
      source[key].push(...patch[key])
    } else if (isArticlePart(source[key]) && isArticlePart(patch[key])) {
      source[key] = mergePart(source[key], patch[key])
    } else {
      source[key] = patch[key]
    }
  }

  return source
}

interface ArticlePart {
  [key: string | symbol]: ArticlePart | DocSection | DocSection[] | undefined
}

/**
 * 文档页面节点参数
 */
interface IDocArticleParameters extends IDocSectionParameters {
  /** 文档元数据 */
  meta: Record<string | symbol, unknown>
  /** 文档片段 */
  parts?: ArticlePart
}

/**
 * 文档页面节点，用于表示一个独立的文档页面
 *
 * @remarks
 * 文档页面节点是一个特殊的文档节点，它包含了一些额外的元数据，用于描述一个独立的文档页面。
 * 若需拓展节点内容，可通过 {@link DocArticle.addPart} 方法添加自定义内容。
 */
@customNode('Page')
class DocArticle extends DocNode {
  static readonly definition: Readonly<IDocNodeDefinition>

  /** {@link IDocArticleParameters.meta} */
  public readonly meta: IDocArticleParameters['meta']

  /** 文档片段集合 */
  parts: ArticlePart

  /** 移除某片段 */
  delPart = (key: string | symbol): boolean => Reflect.deleteProperty(this.parts, key)

  /** 添加文档片段 */
  addPart(key: string | symbol, part: ArticlePart): void {
    this.parts[key] = part
  }

  /** 合并文档片段 */
  mergePart = (patch: ArticlePart) => {
    mergePart(this.parts, patch)
  }

  /** 合并文档片段 */
  mergeMeta = (patch: Record<string | symbol, unknown>) => {
    mergeMeta(this.meta, patch)
  }

  /** 获取指定文档片段 */
  getPart<T extends ArticlePart | DocSection>(key: string | symbol): T | undefined {
    return this.parts[key] as T
  }

  get kind() {
    return DocArticle.definition.docNodeKind
  }

  /** {@link IDocArticleParameters.meta} */
  public readonly frontMatter: IDocArticleParameters['meta']

  constructor({ meta, parts = {}, ...params }: IDocArticleParameters) {
    super(params)
    this.parts = parts
    this.meta = meta
    this.frontMatter = meta
  }
}

export { type ArticlePart, DocArticle, type IDocArticleParameters }
