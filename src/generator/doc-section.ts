import {
  ApiClass,
  ApiDeclaredItem,
  ApiDocumentedItem,
  ApiInterface,
  ApiItemKind,
  ApiReleaseTagMixin,
  ApiTypeAlias,
  ReleaseTag
} from '@microsoft/api-extractor-model'
import {
  DocFencedCode,
  DocParagraph,
  DocPlainText,
  DocSection,
  StandardTags,
  TSDocConfiguration
} from '@microsoft/tsdoc'
import consola from 'consola'

import type { ApiEnum, ApiItem, ApiModel, ApiPackage, ExcerptToken } from '@microsoft/api-extractor-model'
import type { DocBlock } from '@microsoft/tsdoc'

import { getFilenameFormApiItem } from '../model'
import { getReferenceApiItem, getSourceFileFromApiItem } from '../model/utils'
import {
  appendNodesToContainer,
  type BreadcrumbItem,
  buildCommaNode,
  buildExcerptTokenWithHyperLink,
  CustomDocNodeKind,
  docBlockFilter,
  DocEmphasisSpan,
  DocFrontMatter,
  DocHeading,
  DocNoteBox,
  registerDocNodes
} from '../nodes'
import { getUnscopedPackageName } from '../utils'
import {
  generateClassTable,
  generateEnumTable,
  generateInterfaceTables,
  generateModelTable,
  generatePackageOrNamespaceTables
} from './doc-section-table'

export interface FrontMatterData {
  breadcrumb: BreadcrumbItem[]
  kind: string
  releaseTag: ReleaseTag
  /** The source code url */
  source?: string
  /** The doc title */
  title: string
}

const generateBreadcrumb = (apiItem: ApiItem): BreadcrumbItem[] => {
  const breadcrumb: BreadcrumbItem[] = [{ linkText: 'Home', urlDestination: getFilenameFormApiItem(apiItem) }]

  for (const hierarchyItem of apiItem.getHierarchy()) {
    switch (hierarchyItem.kind) {
      case ApiItemKind.EntryPoint:
      case ApiItemKind.Model:
        // We don't show the model as part of the breadcrumb because it is the root-level container.
        // We don't show the entry point because today API Extractor doesn't support multiple entry points;
        // this may change in the future.
        break
      default:
        breadcrumb.push({
          linkText: hierarchyItem.displayName,
          urlDestination: getFilenameFormApiItem(hierarchyItem)
        })
    }
  }

  return breadcrumb
}

const categoryMap: Partial<Record<ApiItemKind, string>> = {
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
const generateSectionTitle = (apiItem: ApiItem): string => {
  const scopedName = apiItem.getScopedNameWithinPackage()

  if (apiItem.kind in categoryMap) {
    return `${scopedName} ${categoryMap[apiItem.kind]}`
  }

  switch (apiItem.kind) {
    case ApiItemKind.Constructor:
    case ApiItemKind.ConstructSignature:
      return scopedName
    case ApiItemKind.Model:
      return 'Api Reference'
    case ApiItemKind.Package: {
      consola.info(`Writing ${apiItem.displayName} package`)
      return `${getUnscopedPackageName(apiItem.displayName)} package`
    }
  }

  throw new Error(`Unknown ApiItemKind: ${apiItem.kind}`)
}

const generateDeprecatedWarningNote = (configuration: TSDocConfiguration, deprecatedBlock: DocBlock): DocNoteBox => {
  const warning = new DocParagraph({ configuration }, [
    new DocPlainText({ configuration, text: 'Warning: This API is now obsolete.' })
  ])
  return new DocNoteBox({ configuration, type: 'warning' }, [warning, ...deprecatedBlock.content.nodes])
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO split different instances handler
const writeHeritageTypes = (model: ApiModel, apiItem: ApiItem, section: DocSection) => {
  const { configuration } = section
  const spannedTokensMapper = (token: ExcerptToken) => buildExcerptTokenWithHyperLink(model, token, configuration)

  if (apiItem instanceof ApiClass) {
    if (apiItem.extendsType) {
      const extendsParagraph: DocParagraph = new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Extends: ' })])
      ])
      appendNodesToContainer(extendsParagraph, apiItem.extendsType.excerpt.spannedTokens.map(spannedTokensMapper))
      section.appendNode(extendsParagraph)
    }

    if (apiItem.implementsTypes.length > 0) {
      const implementsParagraph: DocParagraph = new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Implements: ' })])
      ])
      let needsComma = false
      for (const implementsType of apiItem.implementsTypes) {
        if (needsComma) {
          implementsParagraph.appendNode(new DocPlainText({ configuration, text: ', ' }))
        }
        appendNodesToContainer(implementsParagraph, implementsType.excerpt.spannedTokens.map(spannedTokensMapper))
        needsComma = true
      }
      section.appendNode(implementsParagraph)
    }
  }

  if (apiItem instanceof ApiInterface && apiItem.extendsTypes.length > 0) {
    const extendsParagraph: DocParagraph = new DocParagraph({ configuration }, [
      new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Extends: ' })])
    ])
    let needsComma = false
    for (const extendsType of apiItem.extendsTypes) {
      if (needsComma) {
        extendsParagraph.appendNode(buildCommaNode(configuration))
      }
      appendNodesToContainer(extendsParagraph, extendsType.excerpt.spannedTokens.map(spannedTokensMapper))
      needsComma = true
    }
    section.appendNode(extendsParagraph)
  }

  if (apiItem instanceof ApiTypeAlias) {
    const refs = apiItem.excerptTokens.filter((token) => getReferenceApiItem(model, token))
    if (refs.length > 0) {
      const referencesParagraph: DocParagraph = new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'References: ' })])
      ])
      let needsComma = false
      const visited = new Set<string>()
      for (const ref of refs) {
        if (visited.has(ref.text)) {
          continue
        }
        visited.add(ref.text)

        if (needsComma) {
          referencesParagraph.appendNode(buildCommaNode(configuration))
        }

        referencesParagraph.appendNode(spannedTokensMapper(ref))
        needsComma = true
      }
      section.appendNode(referencesParagraph)
    }
  }
}

const generateSignature = (model: ApiModel, apiItem: ApiDeclaredItem, section: DocSection): void => {
  if (apiItem.excerpt.text.length <= 0) {
    return
  }

  const { configuration } = section

  section.appendNode(
    new DocParagraph({ configuration }, [
      new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Signature:' })])
    ])
  )
  section.appendNode(
    new DocFencedCode({
      code: apiItem.getExcerptWithModifiers(),
      configuration,
      language: 'typescript'
    })
  )

  writeHeritageTypes(model, apiItem, section)
}

const generateDecorators = (apiItem: ApiItem, section: DocSection): DocBlock[] => {
  const decoratorBlocks: DocBlock[] = []
  const { configuration } = section

  if (apiItem instanceof ApiDocumentedItem) {
    const tsdocComment = apiItem.tsdocComment

    if (tsdocComment) {
      decoratorBlocks.push(
        ...tsdocComment.customBlocks.filter(
          (block) => block.blockTag.tagNameWithUpperCase === StandardTags.decorator.tagNameWithUpperCase
        )
      )

      if (tsdocComment.deprecatedBlock) {
        section.appendNode(generateDeprecatedWarningNote(configuration, tsdocComment.deprecatedBlock))
      }

      appendNodesToContainer(section, tsdocComment.customBlocks)
    }
  }
  return decoratorBlocks
}

const generateRemarkSection = (apiItem: ApiItem, section: DocSection) => {
  if (!(apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment)) {
    return
  }

  const { configuration } = section
  const { customBlocks, remarksBlock } = apiItem.tsdocComment
  // Write the @remarks block
  if (remarksBlock) {
    section.appendNode(new DocHeading({ configuration, title: 'Remarks' }))
    appendNodesToContainer(section, remarksBlock.content.nodes)
  }

  // Write the @example blocks
  const exampleBlocks = docBlockFilter(customBlocks, StandardTags.example.tagNameWithUpperCase)
  let exampleNumber = 1
  for (const exampleBlock of exampleBlocks) {
    const heading = exampleBlocks.length > 1 ? `Example ${exampleNumber}` : 'Example'
    section.appendNode(new DocHeading({ configuration, title: heading }))
    appendNodesToContainer(section, exampleBlock.content.nodes)
    exampleNumber++
  }
}

const generateThrowsSection = (apiItem: ApiItem, section: DocSection) => {
  if (!(apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment)) {
    return
  }

  // Write the @throws blocks
  const throwsBlocks = docBlockFilter(apiItem.tsdocComment.customBlocks, StandardTags.throws.tagNameWithUpperCase)
  if (throwsBlocks.length > 0) {
    section.appendNode(new DocHeading({ configuration: section.configuration, title: 'Exceptions' }))
    appendNodesToContainer(
      section,
      throwsBlocks.flatMap((x) => x.content.nodes)
    )
  }
}

const generateRemarks = (apiModel: ApiModel, apiItem: ApiItem, section: DocSection): ApiItem[] => {
  const subApis: ApiItem[] = []

  let appendRemarks = true
  switch (apiItem.kind) {
    case ApiItemKind.Class:
    case ApiItemKind.Interface:
    case ApiItemKind.Namespace:
    case ApiItemKind.Package: {
      generateRemarkSection(apiItem, section)
      // this._writeRemarksSection(output, apiItem);
      appendRemarks = false
    }
  }

  switch (apiItem.kind) {
    case ApiItemKind.Class:
      subApis.push(...generateClassTable(apiItem as ApiClass, section, apiModel))
      break
    case ApiItemKind.Constructor:
    case ApiItemKind.ConstructSignature:
    case ApiItemKind.Function:
    case ApiItemKind.Method:
    case ApiItemKind.MethodSignature:
      // this._writeParameterTables(output, apiItem as ApiParameterListMixin);
      generateThrowsSection(apiItem, section)
      break
    case ApiItemKind.Enum:
      generateEnumTable(apiItem as ApiEnum, section)
      break
    case ApiItemKind.Interface:
      subApis.push(...generateInterfaceTables(apiItem as ApiInterface, section, apiModel))
      break
    case ApiItemKind.Model:
      subApis.push(...generateModelTable(apiItem as ApiModel, section))
      break
    case ApiItemKind.Namespace:
    case ApiItemKind.Package:
      subApis.push(...generatePackageOrNamespaceTables(apiItem as ApiInterface | ApiPackage, section))
      break
    case ApiItemKind.Property:
    case ApiItemKind.PropertySignature:
    case ApiItemKind.TypeAlias:
    case ApiItemKind.Variable:
      break
    default:
      throw new Error(`Unsupported API item kind: ${apiItem.kind}`)
  }

  if (appendRemarks) {
    generateRemarkSection(apiItem, section)
    // this._writeRemarksSection(output, apiItem);
  }

  return subApis
}

const parseDocSection = (
  model: ApiModel,
  item: ApiItem,
  configuration: TSDocConfiguration
): { section: DocSection; subApis: ApiItem[] } => {
  const section = new DocSection({ configuration })

  section.appendNode(
    new DocFrontMatter<FrontMatterData>({
      configuration,
      data: {
        breadcrumb: generateBreadcrumb(item),
        kind: item.kind,
        releaseTag: ApiReleaseTagMixin.isBaseClassOf(item) ? item.releaseTag : ReleaseTag.None,
        source: getSourceFileFromApiItem(item)?.fileUrlPath,
        title: generateSectionTitle(item)
      }
    })
  )

  const decoratorBlocks = generateDecorators(item, section)

  if (item instanceof ApiDeclaredItem) {
    generateSignature(model, item, section)
  }

  if (decoratorBlocks.length > 0) {
    section.appendNode(
      new DocParagraph({ configuration }, [
        new DocEmphasisSpan({ bold: true, configuration }, [new DocPlainText({ configuration, text: 'Decorators:' })])
      ])
    )

    appendNodesToContainer(section, decoratorBlocks)
  }

  const subApis = generateRemarks(model, item, section)

  return { section, subApis }
}

const defaultConfiguration = () => {
  const configuration = new TSDocConfiguration()
  registerDocNodes(configuration.docNodeManager)
  return configuration
}

export function* docSectionGenerator(
  model: ApiModel,
  item: ApiItem = model,
  configuration = defaultConfiguration()
): Generator<DocSection, void, unknown> {
  const { section, subApis } = parseDocSection(model, item, configuration)
  yield section

  if (subApis.length > 0) {
    for (const api of subApis) {
      yield* docSectionGenerator(model, api, configuration)
    }
  }
}

export const extraFrontmatter = <T>(section: DocSection): T | undefined => {
  if (section.nodes.at(0)?.kind === CustomDocNodeKind.FrontMatter) {
    return (section.nodes.at(0) as DocFrontMatter<T>).data
  }
}
