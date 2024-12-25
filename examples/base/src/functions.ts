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
export const isDirectory = async (path: PathLike): Promise<boolean> => (await stat(path)).isDirectory()

/**
 * Clear a possible directory, if it doesn't exist, an empty directory will be created.
 * @param path - The path to clean.
 * @param ignoreErrors - If true will handle all errors.
 * @throws
 * {@link https://nodejs.org/docs/latest/api/errors.html#common-system-errors | NodeJS.ErrnoException} maybe throw.
 * The error with code `ENOENT` is handled (create an empty directory), other errors will be thrown.
 *
 * @see {@link isDirectory} This call `isDirectory` to check directory.
 *
 * @public
 */
export function cleanDir(path: PathLike, ignoreErrors: true): Promise<void>
export async function cleanDir(path: PathLike): Promise<void> {
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
