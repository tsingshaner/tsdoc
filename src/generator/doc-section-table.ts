import {
  ApiAbstractMixin,
  type ApiClass,
  ApiDocumentedItem,
  type ApiEnum,
  type ApiInterface,
  type ApiItem,
  ApiItemKind,
  type ApiModel,
  type ApiNamespace,
  ApiOptionalMixin,
  type ApiPackage,
  type ApiParameterListMixin,
  ApiPropertyItem,
  ApiProtectedMixin,
  ApiReadonlyMixin,
  ApiReleaseTagMixin,
  ApiReturnTypeMixin,
  ApiStaticMixin,
  ReleaseTag
} from '@microsoft/api-extractor-model'
import {
  DocCodeSpan,
  DocLinkTag,
  type DocNode,
  DocParagraph,
  DocPlainText,
  type DocSection,
  type TSDocConfiguration
} from '@microsoft/tsdoc'
import consola from 'consola'

import { getConciseSignature, getFilenameFormApiItem } from '../model'
import { isAbstract, isEventProperty, isInitializer, isOptional } from '../model/utils'
import {
  appendNodesToContainer,
  buildCodeSpanNode,
  buildCommaNode,
  buildExcerptTokenWithHyperLink,
  DocEmphasisSpan,
  DocHeading,
  DocTable
} from '../nodes'

type DocNodeGenerator<T extends DocNode> = (conf: TSDocConfiguration) => T

const generateTitleCell = (apiItem: ApiItem): DocNodeGenerator<DocParagraph> => {
  let linkText: string = getConciseSignature(apiItem)
  if (ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional) {
    linkText += '?'
  }

  return (configuration: TSDocConfiguration) =>
    new DocParagraph({ configuration }, [
      new DocLinkTag({
        configuration,
        linkText: linkText,
        tagName: '@link',
        urlDestination: getFilenameFormApiItem(apiItem)
      })
    ])
}

const generateModifiersCell = (apiItem: ApiItem): DocNodeGenerator<DocParagraph> => {
  // Output modifiers in syntactically correct order: first access modifier (here: `protected`), then
  // `static` or `abstract` (no member can be both, so the order between the two of them does not matter),
  // last `readonly`. If `override` was supported, it would go directly before `readonly`.
  const modifierMixins = [ApiProtectedMixin, ApiStaticMixin, ApiAbstractMixin, ApiReadonlyMixin]
  const modifiers = ['Protected', 'Static', 'Abstract', 'Readonly'].filter((modifier, i) => {
    return modifierMixins[i].isBaseClassOf(apiItem) && apiItem[`is${modifier}` as keyof ApiItem]
  })

  return (configuration) => {
    const modifierTags: DocNode[] = []
    for (let i = 0; i < modifiers.length; i++) {
      if (i > 0) {
        modifierTags.push(buildCommaNode(configuration))
      }

      modifierTags.push(buildCodeSpanNode(modifiers[i].toLowerCase())(configuration))
    }

    return new DocParagraph({ configuration }, modifierTags)
  }
}

const generateDescriptionCell = (apiItem: ApiItem, isInherited = false): DocNodeGenerator<DocParagraph> => {
  return (configuration) => {
    const paragraph = new DocParagraph({ configuration }, [])

    if (
      ApiReleaseTagMixin.isBaseClassOf(apiItem) &&
      (apiItem.releaseTag === ReleaseTag.Alpha || apiItem.releaseTag === ReleaseTag.Beta)
    ) {
      paragraph.appendNodes([
        new DocEmphasisSpan({ bold: true, configuration, italic: true }, [
          new DocPlainText({
            configuration,
            text: `(${apiItem.releaseTag === ReleaseTag.Alpha ? 'ALPHA' : 'BETA'})`
          })
        ]),
        new DocPlainText({ configuration, text: ' ' })
      ])
    }

    if (isOptional(apiItem)) {
      paragraph.appendNodes([
        new DocEmphasisSpan({ configuration, italic: true }, [new DocPlainText({ configuration, text: '(Optional)' })]),
        new DocPlainText({ configuration, text: ' ' })
      ])
    }

    if (apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment !== undefined) {
      // this._appendAndMergeSection(section, apiItem.tsdocComment.summarySection)
    }

    if (isInherited && apiItem.parent) {
      paragraph.appendNodes(
        // new DocParagraph({ configuration }, [
        [
          new DocPlainText({ configuration, text: '(Inherited from ' }),
          new DocLinkTag({
            configuration,
            linkText: apiItem.parent.displayName,
            tagName: '@link',
            urlDestination: getFilenameFormApiItem(apiItem.parent)
          }),
          new DocPlainText({ configuration, text: ')' })
        ]
      )
      // )
    }

    return paragraph
  }
}

const generateInitializerCell = (apiItem: ApiItem): DocNodeGenerator<DocParagraph> => {
  return (configuration) => {
    const paragraph = new DocParagraph({ configuration }, [])
    if (isInitializer(apiItem)) {
      paragraph.appendNode(new DocCodeSpan({ code: apiItem.initializerExcerpt.text, configuration }))
    }

    return paragraph
  }
}

const generatePropertyTypeCell = (apiItem: ApiItem, model: ApiModel): DocNodeGenerator<DocParagraph> => {
  return (configuration) => {
    const paragraph = new DocParagraph({ configuration }, [])
    if (apiItem instanceof ApiPropertyItem) {
      const excerpt = apiItem.propertyTypeExcerpt
      if (!excerpt.text.trim()) {
        paragraph.appendNode(new DocPlainText({ configuration, text: '(not declared)' }))
      } else {
        paragraph.appendNodes(
          excerpt.spannedTokens.map((token) => buildExcerptTokenWithHyperLink(model, token, configuration))
        )
      }
      // section.appendNode(this._createParagraphForTypeExcerpt(apiItem.propertyTypeExcerpt));
    }

    return paragraph
  }
}

const getMembersAndWriteIncompleteWarning = (
  api: ApiClass | ApiInterface,
  section: DocSection,
  showInheritedMembers = false
) => {
  if (!showInheritedMembers) {
    return api.members
  }

  const result = api.findMembersWithInheritance()
  // If the result is potentially incomplete, write a short warning communicating this.
  if (result.maybeIncompleteResult) {
    const { configuration } = section
    section.appendNode(
      new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ configuration, italic: true }, [
          new DocPlainText({
            configuration,
            text: '(Some inherited members may not be shown because they are not represented in the documentation.)'
          })
        ])
      ])
    )
  }

  // Log the messages for diagnostic purposes.
  for (const message of result.messages) {
    consola.info(`Diagnostic message for findMembersWithInheritance: ${message.text}`)
  }

  return result.items
}

/** Insert table to section, if table has no row will skip. */
const insertTableToSection = (table: DocTable, title: string, section: DocSection) => {
  if (table.rows.length >= 0) {
    const heading = new DocHeading({ configuration: section.configuration, title })
    section.appendNodes([heading, table])
  }
}

type TableTuple = [table: DocTable, title: string]
const insertTablesToSection = (tables: TableTuple[], section: DocSection) => {
  for (const [table, title] of tables) {
    insertTableToSection(table, title, section)
  }
}

export const generateModelTable = (apiModel: ApiModel, section: DocSection): ApiItem[] => {
  const subApis: ApiItem[] = []
  const { configuration } = section
  const packagesTable = new DocTable({ columns: ['Package', 'Description'], configuration })

  for (const apiMember of apiModel.members) {
    if (apiMember.kind === ApiItemKind.Package) {
      packagesTable.addRowFromBuilders([generateTitleCell(apiMember), generateDescriptionCell(apiMember)])
      subApis.push(apiMember)
    }
  }

  insertTableToSection(packagesTable, 'Packages', section)
  return subApis
}

export const generatePackageOrNamespaceTables = (
  apiContainer: ApiNamespace | ApiPackage,
  section: DocSection
): ApiItem[] => {
  const { configuration } = section
  const subApis: ApiItem[] = []

  const abstractClassesTable = new DocTable({ columns: ['Abstract Class', 'Description'], configuration })
  const classesTable = new DocTable({ columns: ['Class', 'Description'], configuration })
  const enumerationsTable = new DocTable({ columns: ['Enumeration', 'Description'], configuration })
  const functionsTable = new DocTable({ columns: ['Function', 'Description'], configuration })
  const interfacesTable = new DocTable({ columns: ['Interface', 'Description'], configuration })
  const namespacesTable = new DocTable({ columns: ['Namespace', 'Description'], configuration })
  const variablesTable = new DocTable({ columns: ['Variable', 'Description'], configuration })
  const typeAliasesTable = new DocTable({ columns: ['Type Alias', 'Description'], configuration })

  const apiMembers =
    apiContainer.kind === ApiItemKind.Package
      ? (apiContainer as ApiPackage).entryPoints[0].members
      : (apiContainer as ApiNamespace).members

  for (const apiMember of apiMembers) {
    const row = [generateTitleCell(apiMember), generateDescriptionCell(apiMember)].map((fn) => fn(configuration))

    switch (apiMember.kind) {
      case ApiItemKind.Class: {
        if (isAbstract(apiMember)) {
          abstractClassesTable.addRow(row)
        } else {
          classesTable.addRow(row)
        }
        break
      }
      case ApiItemKind.Enum:
        enumerationsTable.addRow(row)
        break

      case ApiItemKind.Function:
        functionsTable.addRow(row)
        break

      case ApiItemKind.Interface:
        interfacesTable.addRow(row)
        break

      case ApiItemKind.Namespace:
        namespacesTable.addRow(row)
        break

      case ApiItemKind.TypeAlias:
        typeAliasesTable.addRow(row)
        break

      case ApiItemKind.Variable:
        variablesTable.addRow(row)
        break

      default:
        continue
    }

    subApis.push(apiMember)
  }

  insertTablesToSection(
    [
      [classesTable, 'Classes'],
      [abstractClassesTable, 'Abstract Classes'],
      [enumerationsTable, 'Enumerations'],
      [functionsTable, 'Functions'],
      [interfacesTable, 'Interfaces'],
      [namespacesTable, 'Namespaces'],
      [variablesTable, 'Variables'],
      [typeAliasesTable, 'Type Aliases']
    ],
    section
  )

  return subApis
}

export const generateClassTable = (apiClass: ApiClass, section: DocSection, model: ApiModel): ApiItem[] => {
  const { configuration } = section
  const subApis: ApiItem[] = []

  const eventsTable = new DocTable({ columns: ['Property', 'Modifiers', 'Type', 'Description'], configuration })
  const constructorsTable = new DocTable({ columns: ['Constructor', 'Modifiers', 'Description'], configuration })
  const propertiesTable = new DocTable({ columns: ['Property', 'Modifiers', 'Type', 'Description'], configuration })
  const methodsTable = new DocTable({ columns: ['Method', 'Modifiers', 'Description'], configuration })

  const apiMembers = getMembersAndWriteIncompleteWarning(apiClass, section)

  for (const apiMember of apiMembers) {
    const isInherited: boolean = apiMember.parent !== apiClass
    switch (apiMember.kind) {
      case ApiItemKind.Constructor:
        constructorsTable.addRowFromBuilders([
          generateTitleCell(apiMember),
          generateModifiersCell(apiMember),
          generateDescriptionCell(apiMember, isInherited)
        ])
        break

      case ApiItemKind.Method:
        methodsTable.addRowFromBuilders([
          generateTitleCell(apiMember),
          generateModifiersCell(apiMember),
          generateDescriptionCell(apiMember, isInherited)
        ])
        break

      case ApiItemKind.Property:
        if (isEventProperty(apiMember)) {
          eventsTable.addRowFromBuilders([
            generateTitleCell(apiMember),
            generateModifiersCell(apiMember),
            generatePropertyTypeCell(apiMember, model),
            generateDescriptionCell(apiMember, isInherited)
          ])
        } else {
          propertiesTable.addRowFromBuilders([
            generateTitleCell(apiMember),
            generateModifiersCell(apiMember),
            generatePropertyTypeCell(apiMember, model),
            generateDescriptionCell(apiMember, isInherited)
          ])
        }
        break

      default:
        continue
    }

    subApis.push(apiMember)
  }

  insertTablesToSection(
    [
      [eventsTable, 'Events'],
      [constructorsTable, 'Constructors'],
      [propertiesTable, 'Properties'],
      [methodsTable, 'Methods']
    ],
    section
  )

  return subApis
}

export const generateEnumTable = (apiEnum: ApiEnum, section: DocSection) => {
  const { configuration } = section

  const enumMembersTable: DocTable = new DocTable({
    columns: ['Member', 'Value', 'Description'],
    configuration
  })

  for (const apiEnumMember of apiEnum.members) {
    enumMembersTable.addRow([
      new DocParagraph({ configuration }, [
        new DocPlainText({ configuration, text: getConciseSignature(apiEnumMember) })
      ]),
      generateInitializerCell(apiEnumMember)(configuration),
      generateDescriptionCell(apiEnumMember)(configuration)
    ])
  }

  insertTableToSection(enumMembersTable, 'Enumeration Members', section)
}

export const generateInterfaceTables = (
  apiInterface: ApiInterface,
  section: DocSection,
  model: ApiModel
): ApiItem[] => {
  const { configuration } = section
  const subApis: ApiItem[] = []

  const eventsTable = new DocTable({ columns: ['Property', 'Modifiers', 'Type', 'Description'], configuration })
  const propertiesTable = new DocTable({ columns: ['Property', 'Modifiers', 'Type', 'Description'], configuration })
  const methodsTable = new DocTable({ columns: ['Method', 'Description'], configuration })

  const apiMembers = getMembersAndWriteIncompleteWarning(apiInterface, section)
  for (const apiMember of apiMembers) {
    const isInherited: boolean = apiMember.parent !== apiInterface
    switch (apiMember.kind) {
      case ApiItemKind.ConstructSignature:
      case ApiItemKind.MethodSignature:
        methodsTable.addRowFromBuilders([generateTitleCell(apiMember), generateDescriptionCell(apiMember, isInherited)])
        break

      case ApiItemKind.PropertySignature:
        if (isEventProperty(apiMember)) {
          eventsTable.addRowFromBuilders([
            generateTitleCell(apiMember),
            generateModifiersCell(apiMember),
            generatePropertyTypeCell(apiMember, model),
            generateDescriptionCell(apiMember, isInherited)
          ])
        } else {
          propertiesTable.addRowFromBuilders([
            generateTitleCell(apiMember),
            generateModifiersCell(apiMember),
            generatePropertyTypeCell(apiMember, model),
            generateDescriptionCell(apiMember, isInherited)
          ])
        }
        break

      default:
        continue
    }
    subApis.push(apiMember)
  }

  insertTablesToSection(
    [
      [eventsTable, 'Events'],
      [propertiesTable, 'Properties'],
      [methodsTable, 'Methods']
    ],
    section
  )

  return subApis
}

export const generateParameterTables = (
  apiParameterListMixin: ApiParameterListMixin,
  section: DocSection,
  model: ApiModel
) => {
  const { configuration } = section
  const parametersTable = new DocTable({ columns: ['Parameter', 'Type', 'Description'], configuration })

  for (const apiParameter of apiParameterListMixin.parameters) {
    const parameterDescription = new DocParagraph({ configuration })

    if (apiParameter.isOptional) {
      parameterDescription.appendNodes([
        new DocEmphasisSpan({ configuration, italic: true }, [new DocPlainText({ configuration, text: '(Optional)' })]),
        new DocPlainText({ configuration, text: ' ' })
      ])
    }

    if (apiParameter.tsdocParamBlock) {
      // this._appendAndMergeSection(parameterDescription, apiParameter.tsdocParamBlock.content)
    }

    parametersTable.addRow([
      new DocParagraph({ configuration }, [new DocPlainText({ configuration, text: apiParameter.name })]),
      new DocParagraph(
        { configuration },
        apiParameter.parameterTypeExcerpt.spannedTokens.map((token) =>
          buildExcerptTokenWithHyperLink(model, token, configuration)
        )
      ),
      parameterDescription
    ])
  }

  insertTableToSection(parametersTable, 'Parameters', section)

  if (ApiReturnTypeMixin.isBaseClassOf(apiParameterListMixin)) {
    const returnTypeExcerpt = apiParameterListMixin.returnTypeExcerpt
    section.appendNodes([
      new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Returns:' })])
      ]),
      new DocParagraph(
        { configuration },
        returnTypeExcerpt.spannedTokens.map((token) => buildExcerptTokenWithHyperLink(model, token, configuration))
      )
    ])

    if (
      apiParameterListMixin instanceof ApiDocumentedItem &&
      apiParameterListMixin.tsdocComment &&
      apiParameterListMixin.tsdocComment.returnsBlock
    ) {
      appendNodesToContainer(section, apiParameterListMixin.tsdocComment.returnsBlock.content.nodes)
    }
  }
}
