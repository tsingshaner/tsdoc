import { type ApiItem, ApiItemKind, ApiParameterListMixin } from '@microsoft/api-extractor-model'

/**
 *
 * @param filename
 * @returns
 * @internal
 */
export const encodeFilename = (filename: string) => {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_')
}

export const getUnscopedPackageName = (packageName: string): string => {
  return packageName.replace(/^@[^\/]+\//, '')
}

export const getFilename = (item: ApiItem): string => {
  if (item.kind === ApiItemKind.Model) {
    return 'index.md'
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
