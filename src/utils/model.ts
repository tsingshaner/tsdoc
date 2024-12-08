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
