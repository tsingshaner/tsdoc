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

export const escapeHtml = (text: string): string => {
  return text.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "'":
        return '&#39;'
      case '"':
        return '&quot;'
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      default:
        return c
    }
  })
}

export const escapeMarkdown = (text: string): string => {
  return text.replace(/([\\`*_{}[\]()#+\-.!\|])/g, '\\$1')
}
