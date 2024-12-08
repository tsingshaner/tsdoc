import {
  ApiDeclaredItem,
  type ApiItem,
  ApiItemKind,
  type ApiModel,
  ApiParameterListMixin,
  type ExcerptToken,
  ExcerptTokenKind
} from '@microsoft/api-extractor-model'

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
    // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
    let qualifiedName: string = encodeFilename(hierarchyItem.displayName)
    if (ApiParameterListMixin.isBaseClassOf(hierarchyItem) && hierarchyItem.overloadIndex > 1) {
      // Subtract one for compatibility with earlier releases of API Documenter.
      // (This will get revamped when we fix GitHub issue #1308)
      qualifiedName += `_${hierarchyItem.overloadIndex - 1}`
    }

    switch (hierarchyItem.kind) {
      case ApiItemKind.EntryPoint:
      case ApiItemKind.EnumMember:
      case ApiItemKind.Model:
        break
      case ApiItemKind.Package:
        baseName = encodeFilename(getUnscopedPackageName(hierarchyItem.displayName))
        break
      default:
        baseName += `.${qualifiedName}`
    }
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
