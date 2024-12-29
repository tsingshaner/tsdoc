import { ApiItemKind, ApiPropertyItem, ApiReturnTypeMixin, ReleaseTag } from '@microsoft/api-extractor-model'
import {
  DocCodeSpan,
  DocLinkTag,
  DocNodeKind,
  DocParagraph,
  DocPlainText,
  DocSection,
  StandardTags
} from '@microsoft/tsdoc'
import consola from 'consola'

import type {
  ApiClass,
  ApiEnum,
  ApiInterface,
  ApiItem,
  ApiModel,
  ApiNamespace,
  ApiPackage,
  ApiParameterListMixin
} from '@microsoft/api-extractor-model'
import type { DocNode, TSDocConfiguration } from '@microsoft/tsdoc'

import { getConciseSignature, isEventProperty, isInitializer, isOptional, isProtected, isStatic } from '../model'
import { getAnchorID, getReleaseTag, isReadonly } from '../model'
import { hasTsdocComment, isAbstract } from '../model'
import {
  buildCodeSpanNode,
  buildCommaNode,
  buildExcerptWithHyperLinks,
  docBlockFilter,
  DocEmphasisSpan,
  type DocNodeBuilder
} from '../nodes'
import { MaybeIncomplete } from './constants'

import type {
  ClassTablePart,
  EnumTablePart,
  GenerateResult,
  GeneratorContext,
  InterfaceTablePart,
  ModelTablePart,
  PackageOrNamespaceTablePart,
  ParameterTablePart
} from './types'

type CellNodesBuilder = (configuration: TSDocConfiguration) => DocNode[]
type DocNodesOrBuilder = CellNodesBuilder | DocNode[]

const genTitleCell = (api: ApiItem): CellNodesBuilder => {
  let linkText = getConciseSignature(api)
  if (isOptional(api)) {
    linkText += '?'
  }

  return (configuration) => [
    new DocParagraph({ configuration }, [
      new DocLinkTag({
        configuration,
        linkText,
        tagName: '@link',
        urlDestination: getAnchorID(api)
      })
    ])
  ]
}

const genOptionalNodes = (api: ApiItem, configuration: TSDocConfiguration): DocNode[] => {
  return isOptional(api)
    ? [
        new DocEmphasisSpan({ configuration, italic: true }, [new DocPlainText({ configuration, text: '(Optional)' })]),
        new DocPlainText({ configuration, text: ' ' })
      ]
    : []
}

const genDescriptionCell = (api: ApiItem, isInherited = false): CellNodesBuilder => {
  return (configuration) => {
    const paragraph = new DocParagraph({ configuration }, genOptionalNodes(api, configuration))
    const softBreak = new DocPlainText({ configuration, text: ' ' })
    const nodes: DocNode[] = [paragraph]
    const releaseTag = getReleaseTag(api)

    if (releaseTag === ReleaseTag.Alpha || releaseTag === ReleaseTag.Beta) {
      paragraph.appendNodes([
        new DocEmphasisSpan({ bold: true, configuration, italic: true }, [
          new DocPlainText({
            configuration,
            text: `(${releaseTag === ReleaseTag.Alpha ? 'Alpha' : 'Beta'})`
          })
        ]),
        softBreak
      ])
    }

    if (hasTsdocComment(api)) {
      nodes.push(...api.tsdocComment.summarySection.nodes)
    }

    if (isInherited && !!api.parent) {
      paragraph.appendNodes([
        new DocPlainText({ configuration, text: '(Inherited from ' }),
        new DocLinkTag({
          configuration,
          linkText: api.parent.displayName,
          tagName: '@link',
          urlDestination: getAnchorID(api.parent)
        }),
        new DocPlainText({ configuration, text: ')' })
      ])
    }

    return nodes
  }
}

const genInitializerCell = (api: ApiItem): CellNodesBuilder => {
  return (configuration) => [
    new DocParagraph(
      { configuration },
      isInitializer(api) ? [new DocCodeSpan({ code: api.initializerExcerpt.text, configuration })] : undefined
    )
  ]
}

const modifierValidators = {
  abstract: isAbstract,
  protected: isProtected,
  readonly: isReadonly,
  static: isStatic
}
const genModifiersCell = (api: ApiItem): CellNodesBuilder => {
  // Output modifiers in syntactically correct order: first access modifier (here: `protected`), then
  // `static` or `abstract` (no member can be both, so the order between the two of them does not matter),
  // last `readonly`. If `override` was supported, it would go directly before `readonly`.
  return (configuration) => {
    const modifierParagraph = new DocParagraph({ configuration })
    let commaNode: DocNode | undefined
    for (const modifier in modifierValidators) {
      if (modifierValidators[modifier as keyof typeof modifierValidators](api)) {
        modifierParagraph.appendNode(buildCodeSpanNode(modifier)(configuration))

        if (commaNode !== undefined) {
          modifierParagraph.appendNode(commaNode)
        } else {
          commaNode = buildCommaNode(configuration)
        }
      }
    }

    return [modifierParagraph]
  }
}

const genPropertyTypeCell = (ctx: GeneratorContext, api: ApiItem): CellNodesBuilder => {
  return (configuration) => {
    const paragraph = new DocParagraph({ configuration }, [])
    if (api instanceof ApiPropertyItem) {
      const excerpt = api.propertyTypeExcerpt
      if (!excerpt.text.trim()) {
        paragraph.appendNode(new DocPlainText({ configuration, text: '(not declared)' }))
      } else {
        paragraph.appendNodes(buildExcerptWithHyperLinks(excerpt, ctx.model, configuration))
      }
    }

    return [paragraph]
  }
}

const getMembersAndWriteIncompleteWarning = (
  api: ApiClass | ApiInterface,
  showInheritedMembers = false
): [items: readonly ApiItem[], maybeIncomplete: boolean] => {
  if (!showInheritedMembers) {
    return [api.members, false]
  }

  const result = api.findMembersWithInheritance()
  // If the result is potentially incomplete, write a short warning communicating this.
  // text: '(Some inherited members may not be shown because they are not represented in the documentation.)'
  if (result.maybeIncompleteResult) {
    // Log the messages for diagnostic purposes.
    for (const message of result.messages) {
      consola.warn(`Diagnostic message for findMembersWithInheritance: ${message.text}`)
    }
  }

  return [result.items, result.maybeIncompleteResult]
}

class TableBuilder<T extends Readonly<Record<'description' | ({} & string), DocSection[]>>> {
  static fromColumns = <T extends Readonly<Record<'description' | ({} & string), DocSection[]>>>(
    keys: readonly Exclude<keyof T, 'description'>[],
    configuration: TSDocConfiguration
  ) =>
    new TableBuilder<T>(
      Object.fromEntries<DocSection[]>([...keys, 'description'].map((key) => [key, []])) as T,
      configuration
    )

  #buildCell

  addRow = (row: Record<keyof T, DocNodesOrBuilder>) => {
    for (const col in row) {
      this.tablePart[col].push(this.#buildCell(row[col]))
    }
  }

  constructor(
    public tablePart: T,
    configuration: TSDocConfiguration
  ) {
    this.#buildCell = (nodes: DocNodesOrBuilder): DocSection =>
      new DocSection({ configuration }, Array.isArray(nodes) ? nodes : nodes(configuration))
  }

  get size() {
    return this.tablePart.description.length
  }
}

const genClassesTablePart = (ctx: GeneratorContext, apiClass: ApiClass): GenerateResult<ClassTablePart> => {
  const subApis: ApiItem[] = []
  const [apiMembers, maybeIncomplete] = getMembersAndWriteIncompleteWarning(apiClass)

  type Table = ClassTablePart['class']
  const propertyColumns = ['modifiers', 'property', 'type'] as const
  const tables: { [K in keyof Table]: TableBuilder<Table[K]> } = {
    constructors: TableBuilder.fromColumns(['constructors', 'modifiers'], ctx.tsdocConfiguration),
    events: TableBuilder.fromColumns(propertyColumns, ctx.tsdocConfiguration),
    methods: TableBuilder.fromColumns(['method', 'modifiers'], ctx.tsdocConfiguration),
    properties: TableBuilder.fromColumns(propertyColumns, ctx.tsdocConfiguration)
  }

  for (const apiMember of apiMembers) {
    const isInherited = apiMember.parent !== apiClass
    switch (apiMember.kind) {
      case ApiItemKind.Constructor:
        tables.constructors.addRow({
          constructors: genTitleCell(apiMember),
          description: genDescriptionCell(apiMember, isInherited),
          modifiers: genModifiersCell(apiMember)
        })
        break
      case ApiItemKind.Method:
        tables.methods.addRow({
          description: genDescriptionCell(apiMember, isInherited),
          method: genTitleCell(apiMember),
          modifiers: genModifiersCell(apiMember)
        })
        break
      case ApiItemKind.Property: {
        ;(isEventProperty(apiMember) ? tables.events : tables.properties).addRow({
          description: genDescriptionCell(apiMember, isInherited),
          modifiers: genModifiersCell(apiMember),
          property: genTitleCell(apiMember),
          type: genPropertyTypeCell(ctx, apiMember)
        })
        break
      }
      default:
        continue
    }

    subApis.push(apiMember)
  }

  return {
    meta: {
      [MaybeIncomplete]: maybeIncomplete
    },
    part: {
      class: Object.fromEntries(Object.entries(tables).map(([key, table]) => [key, table.tablePart])) as Table
    },
    subApis
  }
}

// Write the @throws blocks
const genThrowsPart = (api: ApiItem): DocNodeBuilder<DocSection> | undefined => {
  if (hasTsdocComment(api)) {
    const throwsBlocks = docBlockFilter(api.tsdocComment.customBlocks, StandardTags.throws.tagNameWithUpperCase)
    if (throwsBlocks.length > 0) {
      return (configuration) =>
        new DocSection(
          { configuration },
          throwsBlocks.flatMap((x) => x.content.nodes)
        )
    }
  }
}

const genParameterTable = (
  { model, tsdocConfiguration: configuration }: GeneratorContext,
  api: ApiParameterListMixin
): GenerateResult<ParameterTablePart> => {
  const parametersTable = TableBuilder.fromColumns<ParameterTablePart['parameter']['parameters']>(
    ['parameter', 'type'],
    configuration
  )

  for (const apiParameter of api.parameters) {
    const parameterDescription = new DocParagraph(
      { configuration },
      genOptionalNodes(apiParameter as unknown as ApiItem, configuration)
    )

    for (const node of apiParameter.tsdocParamBlock?.content.nodes ?? []) {
      if ((node.kind as DocNodeKind) === DocNodeKind.Paragraph) {
        parameterDescription.appendNodes((node as DocParagraph).nodes)
      }
    }

    parametersTable.addRow({
      description: [parameterDescription],
      parameter: [new DocParagraph({ configuration }, [new DocPlainText({ configuration, text: apiParameter.name })])],
      type: [
        new DocParagraph(
          { configuration },
          apiParameter.parameterTypeExcerpt.isEmpty
            ? [new DocPlainText({ configuration, text: '(not declared)' })]
            : buildExcerptWithHyperLinks(apiParameter.parameterTypeExcerpt, model, configuration)
        )
      ]
    })
  }

  const returns = new DocSection({ configuration }, [])
  if (ApiReturnTypeMixin.isBaseClassOf(api)) {
    const returnTypeExcerpt = api.returnTypeExcerpt
    returns.appendNodes([
      new DocParagraph({ configuration }, buildExcerptWithHyperLinks(returnTypeExcerpt, model, configuration))
    ])

    if (hasTsdocComment(api) && api.tsdocComment.returnsBlock) {
      returns.appendNodes(api.tsdocComment.returnsBlock.content.nodes)
    }
  }

  return {
    part: {
      parameter: {
        parameters: parametersTable.tablePart,
        returns: returns.nodes.length > 0 ? returns : undefined,
        throws: genThrowsPart(api)?.(configuration)
      }
    }
  }
}

const genEnumTable = (ctx: GeneratorContext, api: ApiEnum): GenerateResult<EnumTablePart> => {
  const enumTable = TableBuilder.fromColumns<EnumTablePart['enums']>(['member', 'value'], ctx.tsdocConfiguration)

  for (const apiEnumMember of api.members) {
    enumTable.addRow({
      description: genDescriptionCell(apiEnumMember),
      member: (configuration) => [
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: getConciseSignature(apiEnumMember) })
        ])
      ],
      value: genInitializerCell(apiEnumMember)
    })
  }

  return { part: { enums: enumTable.tablePart } }
}

const genModelTable = (ctx: GeneratorContext, api: ApiModel): GenerateResult<ModelTablePart> => {
  const modelTable = TableBuilder.fromColumns<ModelTablePart['models']>(['package'], ctx.tsdocConfiguration)

  for (const apiPackage of api.packages) {
    modelTable.addRow({
      description: genDescriptionCell(apiPackage),
      package: genTitleCell(apiPackage)
    })
  }

  return { part: { models: modelTable.tablePart }, subApis: [...api.packages] }
}

const genInterfaceTables = (ctx: GeneratorContext, api: ApiInterface): GenerateResult<InterfaceTablePart> => {
  type Table = InterfaceTablePart['interface']
  const subApis: ApiItem[] = []
  const tables: { [K in keyof Table]: TableBuilder<Table[K]> } = {
    events: TableBuilder.fromColumns(['modifiers', 'property', 'type'], ctx.tsdocConfiguration),
    methods: TableBuilder.fromColumns(['method'], ctx.tsdocConfiguration),
    properties: TableBuilder.fromColumns(['modifiers', 'property', 'type'], ctx.tsdocConfiguration)
  }

  const [apiMembers, maybeIncomplete] = getMembersAndWriteIncompleteWarning(api)
  for (const apiMember of apiMembers) {
    const isInherited: boolean = apiMember.parent !== api
    switch (apiMember.kind) {
      case ApiItemKind.ConstructSignature:
      case ApiItemKind.MethodSignature:
        tables.methods.addRow({
          description: genDescriptionCell(apiMember, isInherited),
          method: genTitleCell(apiMember)
        })
        break

      case ApiItemKind.PropertySignature:
        {
          ;(isEventProperty(apiMember) ? tables.events : tables.properties).addRow({
            description: genDescriptionCell(apiMember, isInherited),
            modifiers: genModifiersCell(apiMember),
            property: genTitleCell(apiMember),
            type: genPropertyTypeCell(ctx, apiMember)
          })
        }
        break

      default:
        continue
    }
    subApis.push(apiMember)
  }

  return {
    meta: {
      [MaybeIncomplete]: maybeIncomplete
    },
    part: {
      interface: Object.fromEntries(Object.entries(tables).map(([key, table]) => [key, table.tablePart])) as Table
    },
    subApis
  }
}

const genPkgOrNamespaceTables = (
  ctx: GeneratorContext,
  members: readonly ApiItem[]
): GenerateResult<PackageOrNamespaceTablePart> => {
  const subApis: ApiItem[] = []

  type Table = PackageOrNamespaceTablePart['pkgOrNamespace']
  const tables: { [K in keyof Table]: TableBuilder<Table[K]> } = {
    abstractClasses: TableBuilder.fromColumns(['abstractClass'], ctx.tsdocConfiguration),
    classes: TableBuilder.fromColumns(['class'], ctx.tsdocConfiguration),
    enums: TableBuilder.fromColumns(['enum'], ctx.tsdocConfiguration),
    functions: TableBuilder.fromColumns(['function'], ctx.tsdocConfiguration),
    interfaces: TableBuilder.fromColumns(['interface'], ctx.tsdocConfiguration),
    namespaces: TableBuilder.fromColumns(['namespace'], ctx.tsdocConfiguration),
    typeAliases: TableBuilder.fromColumns(['typeAlias'], ctx.tsdocConfiguration),
    variables: TableBuilder.fromColumns(['variable'], ctx.tsdocConfiguration)
  } as const

  for (const apiMember of members) {
    const title = genTitleCell(apiMember)
    const description = genDescriptionCell(apiMember)

    switch (apiMember.kind) {
      case ApiItemKind.Class: {
        if (isAbstract(apiMember)) {
          tables.abstractClasses.addRow({ abstractClass: title, description })
        } else {
          tables.classes.addRow({ class: title, description })
        }
        break
      }
      case ApiItemKind.Enum:
        tables.enums.addRow({ description, enum: title })
        break
      case ApiItemKind.Function:
        tables.functions.addRow({ description, function: title })
        break
      case ApiItemKind.Interface:
        tables.interfaces.addRow({ description, interface: title })
        break
      case ApiItemKind.Namespace:
        tables.namespaces.addRow({ description, namespace: title })
        break
      case ApiItemKind.TypeAlias:
        tables.typeAliases.addRow({ description, typeAlias: title })
        break
      case ApiItemKind.Variable:
        tables.variables.addRow({ description, variable: title })
        break
      default:
        continue
    }

    subApis.push(apiMember)
  }

  return {
    part: {
      pkgOrNamespace: Object.fromEntries(Object.entries(tables).map(([key, table]) => [key, table.tablePart])) as Table
    },
    subApis
  }
}

export const genTablesPart = (ctx: GeneratorContext, api: ApiItem): GenerateResult | undefined => {
  switch (api.kind) {
    case ApiItemKind.Class:
      return genClassesTablePart(ctx, api as ApiClass)
    case ApiItemKind.Constructor:
    case ApiItemKind.ConstructSignature:
    case ApiItemKind.Function:
    case ApiItemKind.Method:
    case ApiItemKind.MethodSignature:
      return genParameterTable(ctx, api as ApiParameterListMixin)
    case ApiItemKind.Enum:
      return genEnumTable(ctx, api as ApiEnum)
    case ApiItemKind.Interface:
      return genInterfaceTables(ctx, api as ApiInterface)
    case ApiItemKind.Model:
      return genModelTable(ctx, api as ApiModel)
    case ApiItemKind.Namespace:
      return genPkgOrNamespaceTables(ctx, (api as ApiNamespace).members)
    case ApiItemKind.Package:
      return genPkgOrNamespaceTables(ctx, (api as ApiPackage).entryPoints[0].members)
    case ApiItemKind.Property:
    case ApiItemKind.PropertySignature:
    case ApiItemKind.TypeAlias:
    case ApiItemKind.Variable:
      break
    default:
      throw new Error(`Unsupported API item kind: ${api.kind}`)
  }
}
