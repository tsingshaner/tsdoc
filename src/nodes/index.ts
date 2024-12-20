import { DocNodeKind, type DocNodeManager } from '@microsoft/tsdoc'

import { name } from '../../package.json'
import {
  CustomDocNodeKind,
  DocBreadcrumb,
  DocEmphasisSpan,
  DocFrontMatter,
  DocHeading,
  DocNoteBox,
  DocTable,
  DocTableRow
} from './custom-nodes'
import { DocArticle } from './custom-nodes/article'

export {
  CustomDocNodeKind,
  DocBreadcrumb,
  DocEmphasisSpan,
  DocFrontMatter,
  DocHeading,
  DocNoteBox,
  DocTable,
  DocTableRow
}
/**
 * Register all custom nodes to the manager
 * @param manager - A DocNodeManager instance.
 * @example
 * ```ts
 * const configuration = new TSDocConfiguration()
 * registerDocNodes(configuration.docNodeManager)
 * ```
 */
export const registerDocNodes = <T extends Pick<DocNodeManager, 'registerAllowableChildren' | 'registerDocNodes'>>(
  manager: T
) => {
  const nodes = [
    DocHeading,
    DocFrontMatter,
    DocEmphasisSpan,
    DocTable,
    DocBreadcrumb,
    DocNoteBox,
    DocTableRow,
    DocArticle
  ]

  manager.registerDocNodes(
    name,
    nodes.map((node) => node.definition)
  )

  manager.registerAllowableChildren(
    DocNodeKind.Section,
    Object.values(CustomDocNodeKind).filter((x) => x !== CustomDocNodeKind.EmphasisSpan)
  )

  manager.registerAllowableChildren(DocArticle.definition.docNodeKind, [
    DocNodeKind.FencedCode,
    DocNodeKind.Paragraph,
    DocNodeKind.HtmlStartTag,
    DocNodeKind.HtmlEndTag
  ])
  manager.registerAllowableChildren(DocNodeKind.Section, [DocNodeKind.Block])
  manager.registerAllowableChildren(DocNodeKind.Paragraph, [CustomDocNodeKind.EmphasisSpan])
  manager.registerAllowableChildren(CustomDocNodeKind.NoteBox, [
    DocNodeKind.FencedCode,
    DocNodeKind.Paragraph,
    DocNodeKind.HtmlStartTag,
    DocNodeKind.HtmlEndTag
  ])
  manager.registerAllowableChildren(CustomDocNodeKind.TableRow, [DocNodeKind.Paragraph])
  manager.registerAllowableChildren(CustomDocNodeKind.EmphasisSpan, [DocNodeKind.PlainText, DocNodeKind.SoftBreak])
}

export type * from './custom-nodes'
export { customNode, kindGetter } from './decorator'
export {
  appendNodesToContainer,
  buildCodeSpanNode,
  buildCommaNode,
  buildExcerptTokenWithHyperLink,
  buildExcerptWithHyperLinks,
  docBlockFilter,
  type DocNodeBuilder
} from './utils'
