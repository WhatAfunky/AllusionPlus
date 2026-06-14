// ============================================================
// FEATURE 4 PATCHES
// Three targeted changes across three files.
// Read carefully — these are NOT complete file replacements.
// ============================================================


// ============================================================
// PATCH A: src/frontend/entities/File.ts
// Three small changes to loosen extension type from
// IMG_EXTENSIONS_TYPE to string.
// ============================================================

// CHANGE A1 — In the import at the top, remove IMG_EXTENSIONS_TYPE:
//
//   BEFORE:
//   import { FILE_TAGS_SORTING_TYPE, FileDTO, FileStats, IMG_EXTENSIONS_TYPE } from '../../api/file';
//
//   AFTER:
//   import { FILE_TAGS_SORTING_TYPE, FileDTO, FileStats } from '../../api/file';


// CHANGE A2 — In the IMetaData interface (~line 30):
//
//   BEFORE:
//   extension: IMG_EXTENSIONS_TYPE;
//
//   AFTER:
//   extension: string;


// CHANGE A3 — In the ClientFile class property (~line 70):
//
//   BEFORE:
//   readonly extension: IMG_EXTENSIONS_TYPE;
//
//   AFTER:
//   readonly extension: string;


// CHANGE A4 — In getMetaData() function (~line 299):
//
//   BEFORE:
//   extension: Path.extname(path).slice(1).toLowerCase() as IMG_EXTENSIONS_TYPE,
//
//   AFTER:
//   extension: Path.extname(path).slice(1).toLowerCase(),


// ============================================================
// PATCH B: src/frontend/stores/LocationStore.ts
// Replace the enabledFileExtensions allowlist system with
// a managedExtensions blocklist system.
// ============================================================

// CHANGE B1 — Update imports at the top.
//
//   BEFORE:
//   import { FileStats, FileDTO, IMG_EXTENSIONS, IMG_EXTENSIONS_TYPE } from '../../api/file';
//
//   AFTER:
//   import { FileStats, FileDTO, ManagedExtension } from '../../api/file';


// CHANGE B2 — Replace the Preferences type and storage key constants (~line 26):
//
//   BEFORE:
//   const PREFERENCES_STORAGE_KEY = 'location-store-preferences';
//   type Preferences = { extensions: IMG_EXTENSIONS_TYPE[] };
//
//   AFTER:
//   const FILE_FORMAT_PREFS_KEY = 'file-format-preferences';


// CHANGE B3 — Replace the enabledFileExtensions observable (~line 62):
//
//   BEFORE:
//   // Allow users to disable certain file types. Global option for now, needs restart
//   // TODO: Maybe per location/sub-location?
//   readonly enabledFileExtensions = observable(new Set<IMG_EXTENSIONS_TYPE>());
//
//   AFTER:
//   /**
//    * User-managed list of file extensions with index/block toggle.
//    * Extensions NOT in this list are indexed by default (everything-in approach).
//    */
//   readonly managedExtensions = observable<ManagedExtension[]>([]);
//
//   /** Computed set of extensions the user has explicitly blocked from indexing. */
//   get blockedExtensions(): Set<string> {
//     return new Set(this.managedExtensions.filter((m) => m.blocked).map((m) => m.extension));
//   }


// CHANGE B4 — Replace the init() preferences loading block (~line 77):
//
//   BEFORE:
//   try {
//     const prefs = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '') as Preferences;
//     (prefs.extensions || IMG_EXTENSIONS).forEach((ext) => this.enabledFileExtensions.add(ext));
//   } catch (e) {
//     // If no preferences found, use defaults
//     IMG_EXTENSIONS.forEach((ext) => this.enabledFileExtensions.add(ext));
//     // By default, disable EXR for now (experimental)
//     this.enabledFileExtensions.delete('exr');
//   }
//
//   AFTER:
//   try {
//     const saved = JSON.parse(
//       localStorage.getItem(FILE_FORMAT_PREFS_KEY) || '[]',
//     ) as ManagedExtension[];
//     runInAction(() => this.managedExtensions.replace(saved));
//   } catch (e) {
//     // No saved preferences — start with empty list (everything indexed)
//   }


// CHANGE B5 — Update ALL THREE ClientLocation constructor calls.
//   Each one has this line:
//     runInAction(() => Array.from(this.enabledFileExtensions)),
//   Replace ALL THREE occurrences with:
//     runInAction(() => Array.from(this.blockedExtensions)),
//
//   The three call sites are approximately at lines 118, 510, and 536.
//   Search for "enabledFileExtensions" to find them all.


// CHANGE B6 — Replace setSupportedImageExtensions() with new methods.
//   Find the setSupportedImageExtensions method and replace it entirely with:

/*
  @action addManagedExtension(extension: string): void {
    if (!this.managedExtensions.find((m) => m.extension === extension)) {
      this.managedExtensions.push({ extension, blocked: false });
      this.saveManagedExtensions();
    }
  }

  @action toggleManagedExtension(extension: string): void {
    const managed = this.managedExtensions.find((m) => m.extension === extension);
    if (managed) {
      managed.blocked = !managed.blocked;
      this.saveManagedExtensions();
      // Keep all locations in sync with the updated blocklist
      this.locationList.forEach((loc) =>
        loc.updateBlockedExtensions(Array.from(this.blockedExtensions)),
      );
    }
  }

  @action removeManagedExtension(extension: string): void {
    const index = this.managedExtensions.findIndex((m) => m.extension === extension);
    if (index !== -1) {
      this.managedExtensions.splice(index, 1);
      this.saveManagedExtensions();
      this.locationList.forEach((loc) =>
        loc.updateBlockedExtensions(Array.from(this.blockedExtensions)),
      );
    }
  }

  saveManagedExtensions(): void {
    localStorage.setItem(
      FILE_FORMAT_PREFS_KEY,
      JSON.stringify(this.managedExtensions.slice()),
    );
  }
*/


// ============================================================
// PATCH C: src/frontend/stores/FileStore.ts
// One line change to loosen the extension type parameter.
// ============================================================

// CHANGE C1 — In deleteFilesByExtension (~line 847):
//
//   BEFORE:
//   @action async deleteFilesByExtension(ext: IMG_EXTENSIONS_TYPE): Promise<void> {
//
//   AFTER:
//   @action async deleteFilesByExtension(ext: string): Promise<void> {
//
// Also remove IMG_EXTENSIONS_TYPE from the imports at the top of FileStore.ts
// if it is no longer used elsewhere in that file.