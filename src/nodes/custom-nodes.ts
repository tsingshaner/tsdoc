import {
  DocNode,
  DocNodeContainer,
  DocParagraph,
  DocPlainText,
  type IDocLinkTagParameters,
  type IDocNodeContainerParameters,
  type IDocNodeDefinition,
  type IDocNodeParameters
} from '@microsoft/tsdoc'

import { customNode, kindGetter } from './decorator'

import type { DocNodeBuilder } from './utils'

const scope = 'Qingshaner'
export const CustomDocNodeKind = {
  /** Breadcrumb for doc path */
  Breadcrumb: `${scope}Breadcrumb`,
  /** A span with bold or italic style */
  EmphasisSpan: `${scope}EmphasisSpan`,
  /** Front matter node, for doc metadata */
  FrontMatter: `${scope}FrontMatter`,
  /** Title, like html H tag */
  Heading: `${scope}Heading`,
  /** Note box */
  NoteBox: `${scope}NoteBox`,
  /** Table, a table to show */
  Table: `${scope}Table`,
  TableRow: `${scope}TableRow`
} as const

export interface IDocFrontMatterParameters<T> extends IDocNodeParameters {
  /** Front matter data */
  data: T
}

@customNode(CustomDocNodeKind.FrontMatter)
class DocFrontMatter<T = unknown> extends DocNode {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  /** {@link IDocFrontMatterParameters.data} */
  readonly data: T
  constructor({ data, ...params }: IDocFrontMatterParameters<T>) {
    super(params)

    this.data = data
  }
}

export interface IDocHeadingParameters extends IDocNodeParameters {
  /** The title level */
  level?: number
  /** The title, default is 2 (h2) */
  title: string
}
@customNode(CustomDocNodeKind.Heading)
class DocHeading extends DocNode {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  /** {@link IDocHeadingParameters.level} */
  readonly level: number
  /** {@link IDocHeadingParameters.title} */
  readonly title: string

  constructor({ level = 2, title, ...params }: IDocHeadingParameters) {
    super(params)

    this.title = title
    this.level = level
  }
}

/** Table node parameters */
export interface IDocTableParameters extends IDocNodeParameters {
  /** Table header list, for example `['Name', 'Age']` */
  columns: string[]
}

/**
 * Table node
 * @example
 * ```ts
 * const table = new DocTable({
 *   columns: ['Name', 'Age'] as const,
 *   rows: [
 *     ['qingshaner', '22'],
 *     ['ling yun', '22']
 *   ]
 * })
 * ```
 */
@customNode(CustomDocNodeKind.Table)
class DocTable extends DocNode {
  static readonly definition: IDocNodeDefinition
  header: DocTableRow

  @kindGetter kind!: string
  rows: DocTableRow[] = []

  addRow(nodes: DocParagraph[]) {
    this.rows.push(new DocTableRow({ configuration: this.configuration, nodes }))
  }

  addRowFromBuilders(builders: DocNodeBuilder<DocParagraph>[]) {
    this.addRow(builders.map((fn) => fn(this.configuration)))
  }

  /** {@link IDocTableParameters.columns} */
  readonly columns: IDocTableParameters['columns']

  constructor({ columns, ...params }: IDocTableParameters) {
    super(params)

    this.header = new DocTableRow({
      nodes: columns.map((text) => new DocParagraph(params, [new DocPlainText({ ...params, text })])),
      ...params
    })

    this.columns = columns
  }
}

export interface ITableRowParameters extends IDocNodeContainerParameters {
  nodes?: DocParagraph[]
}
@customNode(CustomDocNodeKind.TableRow)
class DocTableRow extends DocNode {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  readonly nodes: DocParagraph[] = []

  constructor({ nodes = [], ...param }: ITableRowParameters) {
    super(param)
    this.nodes = nodes
  }
}

export type BreadcrumbItem = Pick<IDocLinkTagParameters, 'linkText' | 'urlDestination'>
export interface IDocBreadcrumbParameters extends IDocNodeParameters {
  /** Links for doc path */
  items: BreadcrumbItem[]
}
@customNode(CustomDocNodeKind.Breadcrumb)
class DocBreadcrumb extends DocNode {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  /** {@link IDocBreadcrumbParameters.items} */
  readonly items: IDocBreadcrumbParameters['items']
  constructor({ items, ...params }: IDocBreadcrumbParameters) {
    super(params)

    this.items = items
  }
}

export interface IDocNoteBoxParameters extends IDocNodeParameters {
  type: 'danger' | 'info' | 'warning'
}
@customNode(CustomDocNodeKind.NoteBox)
class DocNoteBox extends DocNodeContainer {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  readonly type: IDocNoteBoxParameters['type']
  constructor({ type, ...params }: IDocNoteBoxParameters, childNodes?: readonly DocNode[]) {
    super(params, childNodes)
    this.type = type
  }
}

export interface IDocEmphasisSpanParameters extends IDocNodeParameters {
  bold?: boolean
  italic?: boolean
}
@customNode(CustomDocNodeKind.EmphasisSpan)
class DocEmphasisSpan extends DocNodeContainer {
  static readonly definition: IDocNodeDefinition
  get kind(): string {
    return CustomDocNodeKind.EmphasisSpan
  }

  /** {@link IDocEmphasisSpanParameters.bold} */
  readonly bold: boolean
  /** {@link IDocEmphasisSpanParameters.italic} */
  readonly italic: boolean

  constructor({ bold, italic, ...params }: IDocEmphasisSpanParameters, childNodes?: readonly DocNode[]) {
    super(params, childNodes)
    this.bold = !!bold
    this.italic = !!italic
  }
}

export { DocBreadcrumb, DocEmphasisSpan, DocFrontMatter, DocHeading, DocNoteBox, DocTable, DocTableRow }
