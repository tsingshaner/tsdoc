import { ApiClass, ApiDeclaredItem, ApiInterface, ApiTypeAlias } from '@microsoft/api-extractor-model'
import { DocFencedCode, type DocNode, DocParagraph, DocSection } from '@microsoft/tsdoc'

import type { ApiItem, Excerpt } from '@microsoft/api-extractor-model'

import { getReferenceApiItem } from '../model'
import { buildCommaNode, buildExcerptTokenWithHyperLink } from '../nodes'
import { buildExcerptWithHyperLinks } from '../nodes'

import type { ArticlePart } from '../nodes/custom-nodes/article'
import type { GeneratorContext } from './types'

class SectionBuilder {
  #needComma = false
  #p: DocParagraph

  appendNodes = (...nodes: DocNode[]) => {
    if (this.#needComma) {
      this.#p.appendNodes([this.commaNode, ...nodes])
    } else {
      this.#needComma = true
      this.#p.appendNodes(nodes)
    }
  }

  build = (): DocSection => new DocSection({ configuration: this.commaNode.configuration }, [this.#p])

  constructor(private commaNode: DocNode) {
    this.#p = new DocParagraph({ configuration: commaNode.configuration })
  }
}

/** 类型签名片段 */
export interface SignaturePart extends ArticlePart {
  /** 继承的类 */
  extends?: DocSection
  /** 继承的类型 */
  extendTypes?: DocSection
  /** 实现的接口 */
  implements?: DocSection
  /** 类型别名引用 */
  references?: DocSection
  /** 类型声明 */
  signature: DocSection
}
/**
 * 生成类型签名片段
 * @param api
 * @returns
 */
export const genSignaturePart = (
  { model, tsdocConfiguration: configuration }: GeneratorContext,
  api: ApiItem
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
): SignaturePart | undefined => {
  if (!(api instanceof ApiDeclaredItem && api.excerpt.text.length > 0)) {
    return
  }

  const nodeParams = { configuration }
  const part: SignaturePart = {
    signature: new DocSection(nodeParams, [
      new DocFencedCode({
        code: api.getExcerptWithModifiers(),
        configuration,
        language: 'typescript'
      })
    ])
  }

  const excerptMap = (excerpt: Excerpt) => buildExcerptWithHyperLinks(excerpt, model, configuration)
  const commaNode = buildCommaNode(configuration)

  if (api instanceof ApiClass) {
    if (api.extendsType && api.extendsType.excerpt.spannedTokens.length > 0) {
      part.extends = new DocSection(nodeParams, [new DocParagraph(nodeParams, excerptMap(api.extendsType.excerpt))])
    }

    if (api.implementsTypes.length > 0) {
      const implementsSection = new SectionBuilder(commaNode)
      for (const { excerpt } of api.implementsTypes) {
        implementsSection.appendNodes(...excerptMap(excerpt))
      }

      part.implements = implementsSection.build()
    }
  }

  if (api instanceof ApiInterface && api.extendsTypes.length > 0) {
    const extendsSection = new SectionBuilder(commaNode)
    for (const { excerpt } of api.extendsTypes) {
      extendsSection.appendNodes(...excerptMap(excerpt))
    }

    part.extendTypes = extendsSection.build()
  }

  if (api instanceof ApiTypeAlias) {
    const visited = new Set<string>()
    const refs = api.excerptTokens.filter((token) => {
      if (visited.has(token.text) || !getReferenceApiItem(model, token)) {
        return false
      }

      visited.add(token.text)
      return true
    })

    if (refs.length > 0) {
      const referencesSection = new SectionBuilder(commaNode)
      for (const ref of refs) {
        referencesSection.appendNodes(buildExcerptTokenWithHyperLink(model, ref, configuration))
      }

      part.references = referencesSection.build()
    }
  }

  return part
}
