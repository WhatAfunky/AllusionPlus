/**
 * Utilities for reading and writing .allusionignore files.
 *
 * Each Location root can contain a .allusionignore file.
 * Lines starting with # are comments. All other non-empty lines
 * are treated as paths relative to the Location root.
 *
 * Example .allusionignore:
 *   # Ignore WIP folder
 *   _wip/
 *   # Ignore a specific file
 *   references/texture_pack/wood_001.png
 */

import fse from 'fs-extra';
import SysPath from 'path';

export const IGNORE_FILE_NAME = '.allusionignore';

/**
 * Reads the .allusionignore file in the given Location root directory
 * and returns a list of absolute paths to be excluded.
 * Returns an empty array if the file does not exist.
 */
export async function readIgnoreList(locationPath: string): Promise<string[]> {
  const ignoreFilePath = SysPath.join(locationPath, IGNORE_FILE_NAME);

  if (!(await fse.pathExists(ignoreFilePath))) {
    return [];
  }

  try {
    const content = await fse.readFile(ignoreFilePath, 'utf-8');
    return parseIgnoreList(locationPath, content);
  } catch (e) {
    console.error(`Could not read ${IGNORE_FILE_NAME} in ${locationPath}:`, e);
    return [];
  }
}

/**
 * Parses the text content of a .allusionignore file into absolute paths.
 */
export function parseIgnoreList(locationPath: string, content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((relativePath) => SysPath.resolve(locationPath, relativePath));
}

/**
 * Appends a new path entry to the .allusionignore file in the Location root.
 * - The path is stored relative to the Location root.
 * - Directories get a trailing separator as a visual hint (optional, both work).
 * - Silently skips if the entry is already present to avoid duplicates.
 */
export async function appendToIgnoreList(
  locationPath: string,
  absolutePath: string,
  isDirectory: boolean,
): Promise<void> {
  const ignoreFilePath = SysPath.join(locationPath, IGNORE_FILE_NAME);

  const relativePath = SysPath.relative(locationPath, absolutePath);
  // Use forward slashes for cross-platform consistency when writing
  const normalizedRelative = relativePath.replace(/\\/g, '/');
  const entry = isDirectory ? normalizedRelative + '/' : normalizedRelative;

  // Read existing content and avoid writing a duplicate
  let existing = '';
  if (await fse.pathExists(ignoreFilePath)) {
    existing = await fse.readFile(ignoreFilePath, 'utf-8');
    const lines = existing.split('\n').map((l) => l.trim());
    // Match with or without trailing slash to catch both formats
    if (lines.some((l) => l === entry || l === normalizedRelative || l === normalizedRelative + '/')) {
      console.debug('Path already in ignore list, skipping:', entry);
      return;
    }
  }

  // Add a header comment if the file is being created for the first time
  const header =
    existing === ''
      ? '# Allusion ignore list\n# Paths are relative to the Location root folder\n\n'
      : '';
  const separator = existing !== '' && !existing.endsWith('\n') ? '\n' : '';

  await fse.outputFile(ignoreFilePath, existing + header + separator + entry + '\n', 'utf-8');
  console.debug('Added to .allusionignore:', entry);
}

/**
 * Removes a single entry from the .allusionignore file in the Location root.
 * - `absolutePath` is the absolute path as stored in a location's ignoredPaths.
 * - Matching is done on the relative path, ignoring a trailing slash so both the
 *   file form (`foo/bar.png`) and the directory form (`foo/`) are removed.
 * - Comment and blank lines are preserved.
 */
export async function removeFromIgnoreList(
  locationPath: string,
  absolutePath: string,
): Promise<void> {
  const ignoreFilePath = SysPath.join(locationPath, IGNORE_FILE_NAME);
  if (!(await fse.pathExists(ignoreFilePath))) {
    return;
  }

  const target = SysPath.relative(locationPath, absolutePath).replace(/\\/g, '/').replace(/\/+$/, '');

  const content = await fse.readFile(ignoreFilePath, 'utf-8');
  const kept = content.split('\n').filter((line) => {
    const trimmed = line.trim();
    // Keep comments and blank lines untouched
    if (trimmed === '' || trimmed.startsWith('#')) {
      return true;
    }
    return trimmed.replace(/\/+$/, '') !== target;
  });

  await fse.outputFile(ignoreFilePath, kept.join('\n'), 'utf-8');
  console.debug('Removed from .allusionignore:', target);
}

/**
 * Checks whether an absolute path should be excluded based on the ignore list.
 * Supports both exact file matches and prefix matching for directories.
 */
export function isPathIgnored(absolutePath: string, ignoredPaths: string[]): boolean {
  const normalized = SysPath.normalize(absolutePath);
  return ignoredPaths.some((ignored) => {
    const normalizedIgnored = SysPath.normalize(ignored);
    return (
      normalized === normalizedIgnored ||
      normalized.startsWith(normalizedIgnored + SysPath.sep)
    );
  });
}