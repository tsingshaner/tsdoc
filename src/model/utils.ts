import {
  ApiAbstractMixin,
  ApiDeclaredItem,
  ApiDocumentedItem,
  ApiInitializerMixin,
  type ApiItem,
  ApiItemKind,
  type ApiModel,
  ApiOptionalMixin,
  ApiParameterListMixin,
  ApiPropertyItem,
  ApiReleaseTagMixin,
  type Excerpt,
  type ExcerptToken,
  ExcerptTokenKind,
  ReleaseTag
} from '@microsoft/api-extractor-model'

import type { DocComment } from '@microsoft/tsdoc'

import { encodeFilename, getUnscopedPackageName } from '../utils'

/**
 *
 * @param item
 * @returns
 */
export const getFilenameFormApiItem = (item: ApiItem): string => {
  if (item.kind === ApiItemKind.Model) {
    return 'index'
  }

  let baseName = ''
  for (const hierarchyItem of item.getHierarchy()) {
    switch (hierarchyItem.kind) {
      case ApiItemKind.EntryPoint:
      case ApiItemKind.EnumMember:
      case ApiItemKind.Model:
        continue
      case ApiItemKind.Package: {
        baseName = encodeFilename(getUnscopedPackageName(hierarchyItem.displayName))
        continue
      }
    }

    // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
    let qualifiedName: string = encodeFilename(hierarchyItem.displayName)
    if (ApiParameterListMixin.isBaseClassOf(hierarchyItem) && hierarchyItem.overloadIndex > 1) {
      // Subtract one for compatibility with earlier releases of API Documenter.
      // (This will get revamped when we fix GitHub issue #1308)
      qualifiedName += `_${hierarchyItem.overloadIndex - 1}`
    }

    baseName += `.${qualifiedName}`
  }

  return baseName
}

export const getSourceFileFromApiItem = (
  item: ApiItem
): Record<'fileUrlPath' | 'repositoryURL', string | undefined> | undefined => {
  if (item instanceof ApiDeclaredItem) {
    return {
      fileUrlPath: item.fileUrlPath,
      repositoryURL: item.sourceLocation.fileUrl
    }
  }
}

export const getReferenceApiItem = (model: ApiModel, token: ExcerptToken): ApiItem | undefined => {
  if (token.kind === ExcerptTokenKind.Reference && token.canonicalReference) {
    return model.resolveDeclarationReference(token.canonicalReference, undefined).resolvedApiItem
  }
}

export const getExcerptTokenHyperLink = (model: ApiModel, token: ExcerptToken): string | undefined => {
  const referenceApiItem = getReferenceApiItem(model, token)
  return referenceApiItem === undefined ? undefined : getFilenameFormApiItem(referenceApiItem)
}

export const getConciseSignature = (apiItem: ApiItem): string => {
  if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
    return `${apiItem.displayName}(${apiItem.parameters.map((x) => x.name).join(', ')})`
  }
  return apiItem.displayName
}

export const getReleaseTag = (apiItem: ApiItem): ReleaseTag => {
  return ApiReleaseTagMixin.isBaseClassOf(apiItem) ? apiItem.releaseTag : ReleaseTag.None
}

export const isOptional = (apiItem: ApiItem): apiItem is ApiOptionalMixin =>
  ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional

export const isAbstract = (apiItem: ApiItem): apiItem is ApiAbstractMixin =>
  ApiAbstractMixin.isBaseClassOf(apiItem) && apiItem.isAbstract

export const isInitializer = (apiItem: ApiItem): apiItem is { initializerExcerpt: Excerpt } & ApiInitializerMixin =>
  ApiInitializerMixin.isBaseClassOf(apiItem) && apiItem.initializerExcerpt !== undefined

export const isEventProperty = (apiItem: ApiItem): apiItem is { isEventProperty: true } & ApiPropertyItem =>
  apiItem instanceof ApiPropertyItem && apiItem.isEventProperty

export const hasTsdocComment = (apiItem?: ApiItem): apiItem is { tsdocComment: DocComment } & ApiDocumentedItem =>
  apiItem !== undefined && apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment !== undefined
