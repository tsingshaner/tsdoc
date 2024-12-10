import {
  type DocBlock,
  type DocCodeSpan,
  type DocFencedCode,
  type DocHtmlEndTag,
  type DocHtmlStartTag,
  type DocLinkTag,
  type DocNode,
  DocNodeKind,
  type DocParagraph,
  type DocPlainText,
  type DocSection,
  StringBuilder
} from '@microsoft/tsdoc'
import { dump } from 'js-yaml'
import { heading, md } from 'mdbox'

import {
  CustomDocNodeKind,
  type DocEmphasisSpan,
  type DocHeading,
  type DocNoteBox,
  type DocTable,
  type DocTableRow
} from '../nodes'
import { extraFrontmatter } from './doc-section'

/**
 * Convert JavaScript Object to Markdown Front Matter
 * @param data  - The data to convert.
 * @example
 * ```ts
 * // Returns: '---\ntitle: Hello\ndate: 2021-10-01\n---\n'
 * const frontmatter = frontmatter({ title: 'Hello', date: '2021-10-01' })
 * ```
 *
 * @public
 */
export const frontmatter = (data: unknown): string => `---\n${dump(data, { skipInvalid: true })}---\n`

export type DocNodeToMarkdownConverter = (node: DocNode, stringBuilder: StringBuilder) => void

/**
 * Convert a standard tsdoc DocNode to markdown text.
 * @param node - The `DocNode` to convert.
 * @param stringBuilder - The `StringBuilder` instance to append the markdown text.
 * @throws Error if the node kind is not supported.
 */
export const convertDocNodeToMarkdown: DocNodeToMarkdownConverter = (node, stringBuilder) => {
  switch (node.kind as DocNodeKind) {
    case DocNodeKind.Block: {
      convertDocNodeToMarkdown((node as DocBlock).content, stringBuilder)
      return
    }
    case DocNodeKind.CodeSpan: {
      stringBuilder.append(`\`${(node as DocCodeSpan).code}\``)
      return
    }
    case DocNodeKind.Excerpt: {
      return
    }
    case DocNodeKind.FencedCode: {
      const { code, language } = node as DocFencedCode
      stringBuilder.append(`\n${md.codeBlock(code, language)}`)
      return
    }
    case DocNodeKind.HtmlEndTag:
    case DocNodeKind.HtmlStartTag: {
      stringBuilder.append((node as DocHtmlEndTag | DocHtmlStartTag).emitAsHtml())
      return
    }
    case DocNodeKind.InlineTag:
      return
    case DocNodeKind.LinkTag: {
      const { linkText, urlDestination } = node as DocLinkTag
      stringBuilder.append(`[${linkText}](${urlDestination})`)
      return
    }
    case DocNodeKind.Paragraph: {
      const { nodes } = node as DocParagraph
      const textBuilder = new StringBuilder()
      nodes.map((node) => convertCustomDocNodeToMarkdown(node, textBuilder))
      stringBuilder.append(`\n${textBuilder.toString()}\n`)
      return
    }
    case DocNodeKind.PlainText: {
      stringBuilder.append((node as DocPlainText).text)
      return
    }
    case DocNodeKind.Section: {
      const { nodes } = node as DocSection
      for (const node of nodes) {
        convertCustomDocNodeToMarkdown(node, stringBuilder)
      }
      return
    }
    case DocNodeKind.SoftBreak: {
      stringBuilder.append(' ')
      return
    }
  }

  throw new Error(`Unsupported node kind to convert: ${node.kind}`)
}

/**
 * Convert a DocParagraph to markdown table cell text. Will return single line text.
 * @param p - The `DocParagraph` to convert.
 * @returns The markdown table cell text.
 */
const convertParagraphToTableCell = (p: DocParagraph): string => {
  const stringBuilder = new StringBuilder()
  convertDocNodeToMarkdown(p, stringBuilder)

  return stringBuilder.toString().slice(1, -1).replace(/\n/g, '<br />')
}

/**
 * Convert a custom DocNode Or tsdoc standard DocNode to markdown text.
 * Will call {@link convertDocNodeToMarkdown} to convert standard DocNode.
 * @param node - The `DocNode` to convert.
 * @param stringBuilder - The `StringBuilder` instance to append the markdown text.
 */
export const convertCustomDocNodeToMarkdown = (node: DocNode, stringBuilder: StringBuilder): void => {
  switch (node.kind as (typeof CustomDocNodeKind)[keyof typeof CustomDocNodeKind]) {
    case CustomDocNodeKind.Breadcrumb:
    case CustomDocNodeKind.FrontMatter:
      return
    case CustomDocNodeKind.EmphasisSpan: {
      const { bold, italic, nodes } = node as DocEmphasisSpan
      const textBuilder = new StringBuilder()
      for (const node of nodes) {
        convertCustomDocNodeToMarkdown(node, textBuilder)
      }
      let text = textBuilder.toString()

      if (italic) {
        text = md.italic(text)
      }
      if (bold) {
        text = md.bold(text)
      }

      stringBuilder.append(` ${text} `)
      return
    }
    case CustomDocNodeKind.Heading: {
      const { level, title } = node as DocHeading
      stringBuilder.append(heading(title, level))
      return
    }
    case CustomDocNodeKind.NoteBox: {
      const { nodes } = node as DocNoteBox
      const noteBoxBuilder = new StringBuilder()
      for (const node of nodes) {
        convertCustomDocNodeToMarkdown(node, noteBoxBuilder)
      }

      stringBuilder.append(`\n${noteBoxBuilder.toString()}\n`)
      return
    }
    case CustomDocNodeKind.Table: {
      const { header, rows } = node as DocTable
      stringBuilder.append(
        md.table({
          columns: header.nodes.map(convertParagraphToTableCell),
          rows: rows.map((row) => row.nodes.map(convertParagraphToTableCell))
        })
      )

      return
    }
    case CustomDocNodeKind.TableRow: {
      stringBuilder.append(`|${(node as DocTableRow).nodes.map(convertParagraphToTableCell).join(' | ')}|\n`)
      return
    }
    default:
      convertDocNodeToMarkdown(node, stringBuilder)
  }
}

/**
 * Convert a DocSection to markdown text.
 * @param docSection - The `DocSection` to convert.
 * @example
 * ```ts
 * const markdown = convertDocToMarkdown(docSection)
 * writeFile('path/to/file.md', markdown.toString(), 'utf8')
 * ```
 */
export const convertDocToMarkdown = (docSection: DocSection): StringBuilder => {
  const stringBuilder = new StringBuilder()

  let nodes = docSection.nodes
  const frontmatterData = extraFrontmatter(docSection)
  if (frontmatterData !== undefined) {
    stringBuilder.append(frontmatter(frontmatterData))
    nodes = nodes.slice(1)
  }

  stringBuilder.append('<!-- Do not edit this file. It is automatically generated. -->\n')

  for (const node of nodes) {
    if (CustomDocNodeKind.Breadcrumb === node.kind || CustomDocNodeKind.FrontMatter === node.kind) {
      continue
    }

    convertCustomDocNodeToMarkdown(node, stringBuilder)
  }

  return stringBuilder
}
