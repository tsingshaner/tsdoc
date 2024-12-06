import { mkdir, rm, stat } from 'node:fs/promises'

import type { PathLike } from 'node:fs'

/**
 * Check if the path is a directory.
 * @param path - The path to check.
 * @returns A promise that resolves to `true` if the path is a directory, `false` otherwise.
 * @throws
 * {@link https://nodejs.org/docs/latest/api/errors.html#common-system-errors | NodeJS.ErrnoException} maybe throw.
 * If path is not exists, the error with code `ENOENT` will throw.
 *
 * @public
 */
export const isDirectory = async (path: PathLike) => {
  const s = await stat(path)
  return s.isDirectory()
}

/**
 * Clear a possible directory, if it doesn't exist, an empty directory will be created.
 * @param path - The path to clean.
 * @throws
 * {@link https://nodejs.org/docs/latest/api/errors.html#common-system-errors | NodeJS.ErrnoException} maybe throw.
 * The error with code `ENOENT` is handled (create an empty directory), other errors will be thrown.
 *
 * @public
 */
export const cleanDir = async (path: PathLike) => {
  try {
    if (await isDirectory(path)) {
      await rm(path, {
        force: true,
        recursive: true
      })
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await mkdir(path, { recursive: true })
}
