import { DocLinkTag, DocPlainText } from '@microsoft/tsdoc'
import {
  type DocBlock,
  DocCodeSpan,
  type DocNode,
  type DocNodeContainer,
  type TSDocConfiguration
} from '@microsoft/tsdoc'

import type { ApiModel, Excerpt, ExcerptToken } from '@microsoft/api-extractor-model'

import { getExcerptTokenHyperLink } from '../model'

export const appendNodesToContainer = <T extends DocNode>(section: DocNodeContainer, nodes: Readonly<T[]> | T[]) => {
  for (const node of nodes) {
    section.appendNode(node)
  }
}

export type DocNodeBuilder<T extends DocNode> = (configuration: TSDocConfiguration) => T
export const buildCommaNode: DocNodeBuilder<DocPlainText> = (configuration) =>
  new DocPlainText({ configuration, text: ', ' })

export const buildCodeSpanNode = (code: string): DocNodeBuilder<DocCodeSpan> => {
  return (configuration) => new DocCodeSpan({ code, configuration })
}

export const buildExcerptTokenWithHyperLink = (
  model: ApiModel,
  token: ExcerptToken,
  configuration: TSDocConfiguration
): DocLinkTag | DocPlainText => {
  // Markdown doesn't provide a standardized syntax for hyperlinks inside code spans, so we will render
  // the type expression as DocPlainText.  Instead of creating multiple DocParagraphs, we can simply
  // discard any newlines and let the renderer do normal word-wrapping.
  const unwrappedTokenText: string = token.text.replace(/[\r\n]+/g, ' ')
  const urlDestination = getExcerptTokenHyperLink(model, token)

  if (urlDestination) {
    return new DocLinkTag({
      configuration,
      linkText: unwrappedTokenText,
      tagName: '@link',
      urlDestination
    })
  }

  return new DocPlainText({ configuration, text: unwrappedTokenText })
}

export const buildExcerptWithHyperLinks = (excerpt: Excerpt, model: ApiModel, configuration: TSDocConfiguration) =>
  excerpt.spannedTokens.map((token) => buildExcerptTokenWithHyperLink(model, token, configuration))

/**
 * Filter docBlocks by tag name.
 * @param docBlocks - DocBlock instance array to filter.
 * @param tagNameWithUpperCase - UpperCase Tag name to filter, e.g. `PARAM`.
 * @returns
 */
export const docBlockFilter = (docBlocks: DocBlock[] | readonly DocBlock[], tagNameWithUpperCase: string): DocBlock[] =>
  docBlocks.filter((b) => b.blockTag.tagNameWithUpperCase === tagNameWithUpperCase)
