// ============================================================
// FEATURE 2 PATCH FOR: src/frontend/stores/LocationStore.ts
// ============================================================
// This is NOT a complete file replacement. Apply two changes:
//
// CHANGE 1 — Add this import near the top of the file,
//             alongside the other local imports (around line 20):
// ============================================================

import { appendToIgnoreList } from './ignoreList';

// ============================================================
// CHANGE 2 — Add this method inside the LocationStore class.
//             Best placed right after removeSublocationFiles()
//             (around line 756), before the reorder() method.
// ============================================================

  /**
   * Excludes a file (or its parent folder) from Allusion without deleting it from disk.
   *
   * This does two things atomically:
   * 1. Removes the file(s) from the Allusion database immediately.
   * 2. Appends the path to the location's .allusionignore file so it is
   *    never re-indexed on future scans or folder watcher events.
   *
   * Called from the right-click context menu "Exclude from Allusion" submenu.
   */
  @action async excludeFromAllusion(
    file: ClientFile,
    excludeParentFolder: boolean,
  ): Promise<void> {
    const location = this.locationList.find((l) => l.id === file.locationId);
    if (!location) {
      console.error('excludeFromAllusion: could not find location for file', file.absolutePath);
      return;
    }

    const targetPath = excludeParentFolder
      ? SysPath.dirname(file.absolutePath)
      : file.absolutePath;

    try {
      // 1. Write the path to .allusionignore
      await appendToIgnoreList(location.path, targetPath, excludeParentFolder);

      if (excludeParentFolder) {
        // 2a. Remove all files in the folder from the DB (without touching disk)
        const crit = new ClientStringSearchCriteria(
          undefined,
          'absolutePath',
          targetPath + SysPath.sep,
          'startsWith',
        ).toCondition();
        const files = await this.backend.searchFiles(
          { conjunction: 'and', children: [crit] },
          'id',
          OrderDirection.Asc,
          false,
        );
        await this.backend.removeFiles(files.map((f) => f.id));
        this.rootStore.fileStore.refetch();
      } else {
        // 2b. Remove just this one file from the DB (without touching disk)
        const clientFile = this.rootStore.fileStore.get(file.id);
        if (clientFile) {
          await this.rootStore.fileStore.deleteFiles([clientFile]);
        }
      }

      // 3. Reload the ignore list so the watcher and future scans respect the new entry immediately
      await location.reloadIgnoreList();

      AppToaster.show({
        message: excludeParentFolder
          ? `Folder "${SysPath.basename(targetPath)}" excluded from Allusion`
          : `File "${file.name}" excluded from Allusion`,
        timeout: 3000,
      });
    } catch (err) {
      console.error('excludeFromAllusion: failed', err);
      AppToaster.show({
        message: 'Could not exclude from Allusion. Check the console for details.',
        timeout: 5000,
        type: 'warning',
      });
    }
  }