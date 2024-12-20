import { ApiItemKind } from '@microsoft/api-extractor-model'
import consola from 'consola'
import { dump } from 'js-yaml'

import { getUnscopedPackageName } from '../utils'

export const categoryMap: Partial<Record<ApiItemKind, string>> = {
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
export const genArticleTitle = ({
  displayName,
  kind,
  scopedName
}: {
  displayName: string
  kind: ApiItemKind
  scopedName: string
}): string => {
  if (kind in categoryMap) {
    return `${scopedName} ${categoryMap[kind]}`
  }

  switch (kind) {
    case ApiItemKind.Constructor:
    case ApiItemKind.ConstructSignature:
      return scopedName
    case ApiItemKind.Model:
      return 'Api Reference'
    case ApiItemKind.Package: {
      consola.start(`Writing ${displayName} package...`)
      return `${getUnscopedPackageName(displayName)} package`
    }
  }

  throw new Error(`Unknown ApiItemKind: ${kind}`)
}

/**
 * Convert JavaScript Object to Markdown Front Matter
 * @param frontmatter  - The frontmatter data to convert.
 * @example
 * ```ts
 * // Returns: '---\ntitle: Hello\ndate: 2021-10-01\n---\n'
 * const frontmatter = frontmatter({ title: 'Hello', date: '2021-10-01' })
 * ```
 *
 * @public
 */
export const convertFrontmatter = (frontmatter: Record<string, unknown>): string => {
  return `---\n${dump(frontmatter, { indent: 2, skipInvalid: true })}---\n`
}
