import {
  ApiAbstractMixin,
  ApiDeclaredItem,
  ApiDocumentedItem,
  ApiInitializerMixin,
  ApiItemKind,
  ApiOptionalMixin,
  ApiParameterListMixin,
  ApiPropertyItem,
  ApiReleaseTagMixin,
  ExcerptTokenKind,
  ReleaseTag
} from '@microsoft/api-extractor-model'

import type { ApiItem, ApiModel, Excerpt, ExcerptToken } from '@microsoft/api-extractor-model'
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

/** 源代码位置 */
export interface SourceURL {
  /** 源代码文件系统位置 e.g. `dist/src/index.d.ts` */
  fileURLPath?: string
  /** 源代码远程仓库位置 e.g. `https://github.com/tsingshaner/tsdoc/dist/src/index.d.ts`*/
  repositoryURL?: string
}

export const getSourceFileFromApiItem = (item: ApiItem): SourceURL | undefined => {
  if (item instanceof ApiDeclaredItem) {
    return {
      fileURLPath: item.fileUrlPath,
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

/** 获取 api 签名 */
export const getConciseSignature = (apiItem: ApiItem): string => {
  if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
    return `${apiItem.displayName}(${apiItem.parameters.map((x) => x.name).join(', ')})`
  }
  return apiItem.displayName
}

export const getReleaseTag = (apiItem: ApiItem): ReleaseTag => {
  return ApiReleaseTagMixin.isBaseClassOf(apiItem) ? apiItem.releaseTag : ReleaseTag.None
}

export const getSourceUrlPath = (apiItem: ApiItem): string | undefined => {
  if (apiItem instanceof ApiDeclaredItem) {
    return apiItem.fileUrlPath
  }
}

export const isOptional = (apiItem: ApiItem): apiItem is { isOptional: true } & ApiOptionalMixin =>
  ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional

export const isAbstract = (apiItem: ApiItem): apiItem is { isAbstract: true } & ApiAbstractMixin =>
  ApiAbstractMixin.isBaseClassOf(apiItem) && apiItem.isAbstract

export const isInitializer = (apiItem: ApiItem): apiItem is { initializerExcerpt: Excerpt } & ApiInitializerMixin =>
  ApiInitializerMixin.isBaseClassOf(apiItem) && apiItem.initializerExcerpt !== undefined

export const isEventProperty = (apiItem: ApiItem): apiItem is { isEventProperty: true } & ApiPropertyItem =>
  apiItem instanceof ApiPropertyItem && apiItem.isEventProperty

export const hasTsdocComment = (apiItem?: ApiItem): apiItem is { tsdocComment: DocComment } & ApiDocumentedItem =>
  apiItem !== undefined && apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment !== undefined
