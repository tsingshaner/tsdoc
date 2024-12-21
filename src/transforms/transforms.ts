import { ApiItemKind } from '@microsoft/api-extractor-model'
import { DocNodeKind } from '@microsoft/tsdoc'
import consola from 'consola'
import { dump } from 'js-yaml'
import { md } from 'mdbox'

import type {
  DocBlock,
  DocCodeSpan,
  DocFencedCode,
  DocHtmlEndTag,
  DocLinkTag,
  DocNode,
  DocPlainText,
  DocSection
} from '@microsoft/tsdoc'

import { CustomDocNodeKind, type DocEmphasisSpan } from '../nodes'
import { getUnscopedPackageName } from '../utils'

export abstract class Writer {
  abstract newLine(): void
  abstract toString(): string
  abstract write(content: string): void
}

export interface TextWriterOptions {
  endOfLine: 'crlf' | 'lf'
}
export class TextWriter implements Writer {
  #content: string[] = []
  #eol

  constructor(public readonly opts: TextWriterOptions) {
    this.#eol = opts.endOfLine === 'lf' ? '\n' : '\r\n'
  }

  newLine() {
    this.#content.push(this.#eol)
  }

  toString() {
    if (this.#content.length > 1) {
      this.#content = [this.#content.join('')]
    }

    return this.#content.at(0) ?? ''
  }

  write(token: string) {
    this.#content.push(token)
  }
}

export class MarkdownWriter extends TextWriter {
  writerEmptyLine(): void {
    this.newLine()
    this.newLine()
  }
}

export const categoryMap: Partial<Record<ApiItemKind, string>> = {
  [ApiItemKind.Class]: 'class',
  [ApiItemKind.Enum]: 'enum',
  [ApiItemKind.Function]: 'function',
  [ApiItemKind.Interface]: 'interface',
  [ApiItemKind.Method]: 'method',
  [ApiItemKind.MethodSignature]: 'method',
  [ApiItemKind.Namespace]: 'namespace',
  [ApiItemKind.Property]: 'property',
  [ApiItemKind.PropertySignature]: 'property',
  [ApiItemKind.TypeAlias]: 'type',
  [ApiItemKind.Variable]: 'variable'
}
export const genArticleTitle = ({
  displayName,
  kind,
  scopedName
}: {
  displayName: string
  kind: ApiItemKind
  scopedName: string
}): string => {
  if (kind in categoryMap) {
    return `${scopedName} ${categoryMap[kind]}`
  }

  switch (kind) {
    case ApiItemKind.Constructor:
    case ApiItemKind.ConstructSignature:
      return scopedName
    case ApiItemKind.Model:
      return 'Api Reference'
    case ApiItemKind.Package: {
      consola.start(`Writing ${displayName} package...`)
      return `${getUnscopedPackageName(displayName)} package`
    }
  }

  throw new Error(`Unknown ApiItemKind: ${kind}`)
}

/**
 * Convert JavaScript Object to Markdown Front Matter
 * @param frontmatter  - The frontmatter data to convert.
 * @example
 * ```ts
 * // Returns: '---\ntitle: Hello\ndate: 2021-10-01\n---\n'
 * const frontmatter = frontmatter({ title: 'Hello', date: '2021-10-01' })
 * ```
 *
 * @public
 */
export const convertFrontmatter = (frontmatter: Record<string, unknown>): string => {
  return `---\n${dump(frontmatter, { indent: 2, skipInvalid: true })}---\n`
}

export type DocNodeConverter<T extends Writer = Writer> = (
  node: DocNode,
  writer: T,
  converter?: DocNodeConverter<T>
) => void

export const convertStandardDocNodePartToMdx: DocNodeConverter<MarkdownWriter> = (
  node,
  writer,
  converter = convertStandardDocNodePartToMdx
) => {
  switch (node.kind as DocNodeKind) {
    case DocNodeKind.Block: {
      writer.writerEmptyLine()
      converter((node as DocBlock).content, writer, converter)
      writer.writerEmptyLine()
      return
    }
    case DocNodeKind.BlockTag:
    case DocNodeKind.Excerpt:
    case DocNodeKind.InlineTag:
      return
    case DocNodeKind.CodeSpan:
      return writer.write(` \`${(node as DocCodeSpan).code}\` `)
    case DocNodeKind.FencedCode: {
      const { code, language } = node as DocFencedCode
      writer.write(md.codeBlock(code, language))
      return
    }
    case DocNodeKind.HtmlEndTag:
    case DocNodeKind.HtmlStartTag:
      return writer.write((node as DocHtmlEndTag).emitAsHtml())
    case DocNodeKind.LinkTag: {
      const { linkText, urlDestination } = node as DocLinkTag
      if (urlDestination === undefined) {
        consola.warn(`The link tag with link text "${linkText}" has no url destination.`)
      }

      writer.write(
        md.link(urlDestination ?? '#', linkText ?? urlDestination ?? 'link', {
          external: urlDestination?.startsWith('http')
        })
      )
      return
    }
    case DocNodeKind.Paragraph:
    case DocNodeKind.Section: {
      writer.writerEmptyLine()
      for (const child of node.getChildNodes()) {
        converter(child, writer, converter)
      }
      writer.writerEmptyLine()
      return
    }
    case DocNodeKind.PlainText:
      return writer.write((node as DocPlainText).text)
    case DocNodeKind.SoftBreak:
      return writer.write(' ')
  }

  throw new Error(`The shift from (${node.kind}) kind to mdx is not supported.`)
}

export const convertCustomDocNodeToMdx: DocNodeConverter<MarkdownWriter> = (
  node,
  writer,
  converter = convertCustomDocNodeToMdx
) => {
  switch (node.kind) {
    case CustomDocNodeKind.EmphasisSpan: {
      const { bold, italic, nodes } = node as DocEmphasisSpan
      const content = new MarkdownWriter(writer.opts)
      for (const n of nodes) {
        converter(n, content, converter)
      }
      const text = content.toString()

      if (italic && bold) {
        writer.write(md.boldAndItalic(text))
      } else if (italic) {
        writer.write(md.italic(text))
      } else if (bold) {
        writer.write(md.bold(text))
      } else {
        writer.write(text)
      }

      return
    }
  }

  convertStandardDocNodePartToMdx(node, writer, converter)
}

export const convertCustomNodeToMdxText = (node: DocNode, opts: TextWriterOptions): string => {
  const writer = new MarkdownWriter(opts)
  convertCustomDocNodeToMdx(node, writer)
  return writer.toString()
}

export const convertTablePartToMdx = <T extends Record<string, DocSection[]>>(
  writer: MarkdownWriter,
  table: T,
  colMap: [key: keyof T, header: string][]
) => {
  if (colMap.length === 0) {
    return
  }

  const columns = colMap.map(([, header]) => header)
  const rows: string[][] = []
  const rowLength = table[colMap[0][0]].length
  for (let i = 0; i < rowLength; i++) {
    const row: string[] = []
    for (const [key] of colMap) {
      row.push(
        convertCustomNodeToMdxText(table[key][i], writer.opts).trim().replace(/\n+/g, '<br/>').replaceAll('|', '\\|')
      )
    }
    rows.push(row)
  }

  writer.write(md.table({ columns, rows }))
}
