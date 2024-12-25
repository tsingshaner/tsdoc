import { ApiItemKind, ExcerptTokenKind, ReleaseTag } from '@microsoft/api-extractor-model'

import type { ApiItem, ApiModel, ExcerptToken } from '@microsoft/api-extractor-model'

import { encodeFilename, getUnscopedPackageName } from '../utils'
import { hasReleaseTag, isDeclared, isParameterList } from './asserts'

/**
 * 获取 ApiItem 的 ID, 可作为文件名.
 * @param item - `ApiItem` 实例.
 * @returns 返回 ApiItem 的唯一 ID, e.g. `example-base.version`
 */
export const getAnchorID = (item: ApiItem): string => {
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
    if (isParameterList(hierarchyItem) && hierarchyItem.overloadIndex > 1) {
      // Subtract one for compatibility with earlier releases of API Documenter.
      // (This will get revamped when we fix GitHub issue #1308)
      qualifiedName += `_${hierarchyItem.overloadIndex - 1}`
    }

    baseName += `.${qualifiedName}`
  }

  return baseName.toLowerCase()
}

/**
 * @deprecated Please use {@link getAnchorID}.
 */
export const getFilenameFormApiItem = (item: ApiItem): string => getAnchorID(item)

/** 源代码位置 */
export interface SourceURL {
  /** 源代码文件系统位置 e.g. `dist/src/index.d.ts` */
  fileURLPath?: string
  /** 源代码远程仓库位置 e.g. `https://github.com/tsingshaner/tsdoc/dist/src/index.d.ts`*/
  repositoryURL?: string
}

/**
 * 获取 ApiItem 源代码位置对象。
 * @remarks
 * `ApiPackage`, `ApiModel`, `ApiEntryPoint` 返回为 `undefined`。
 */
export const getSourceFileFromApiItem = (item: ApiItem): SourceURL | undefined => {
  if (isDeclared(item)) {
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
  return referenceApiItem && getAnchorID(referenceApiItem)
}

/** 获取 api 签名 */
export const getConciseSignature = (apiItem: ApiItem): string => {
  if (isParameterList(apiItem)) {
    return `${apiItem.displayName}(${apiItem.parameters.map((x) => x.name).join(', ')})`
  }
  return apiItem.displayName
}

/**
 * 获取版本标签
 * @param apiItem - 待查看的 `ApiItem`.
 * @returns ApiItem 若没有定义版本标签则默认返回 `ReleaseTag.None`.
 * @public
 */
export const getReleaseTag = (apiItem: ApiItem): ReleaseTag =>
  hasReleaseTag(apiItem) ? apiItem.releaseTag : ReleaseTag.None
