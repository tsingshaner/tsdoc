import { type ApiItem, ApiItemKind, type ReleaseTag } from '@microsoft/api-extractor-model'

import { getFilenameFormApiItem, getReleaseTag, getSourceFileFromApiItem } from '../model'

import type { SourceURL } from '../model/utils'

/** 面包屑链接 */
interface BreadcrumbLink {
  /** 链接地址 */
  href: string
  /** 链接文本 */
  text: string
}
/**
 * 生成文档面包屑链接组
 * @param api - 文档 api model
 */
const genBreadcrumbLinks = (api: ApiItem): BreadcrumbLink[] => {
  const breadcrumb: BreadcrumbLink[] = [{ href: 'index', text: 'Home' }]

  for (const hierarchyItem of api.getHierarchy()) {
    switch (hierarchyItem.kind) {
      case ApiItemKind.EntryPoint:
      case ApiItemKind.Model:
        // We don't show the model as part of the breadcrumb because it is the root-level container.
        // We don't show the entry point because today API Extractor doesn't support multiple entry points;
        // this may change in the future.
        break
      default:
        breadcrumb.push({
          href: getFilenameFormApiItem(hierarchyItem),
          text: hierarchyItem.displayName
        })
    }
  }

  return breadcrumb
}

/** 文档内置元数据 */
interface FrontMatter extends Record<string | symbol, unknown> {
  breadcrumb: BreadcrumbLink[]
  displayName: string
  kind: ApiItemKind
  releaseTag: ReleaseTag
  /**
   * This returns a scoped name such as "Namespace1.Namespace2.MyClass.myMember()". It does not include the package name or entry point.
   * @remarks — If called on an ApiEntrypoint, ApiPackage, or ApiModel item, the result is an empty string.
   */
  scopedName: string
  /** 源代码位置 */
  source?: SourceURL
}
/**
 * 生成文档默认元数据
 * @param api
 * @returns
 */
const genArticleFrontMatter = (api: ApiItem): FrontMatter => {
  return {
    breadcrumb: genBreadcrumbLinks(api),
    displayName: api.displayName,
    kind: api.kind,
    releaseTag: getReleaseTag(api),
    scopedName: api.getScopedNameWithinPackage(),
    source: getSourceFileFromApiItem(api)
  }
}

export type { BreadcrumbLink, FrontMatter }
export { genArticleFrontMatter, genBreadcrumbLinks }
