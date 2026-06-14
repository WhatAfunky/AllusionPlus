import { observer } from 'mobx-react-lite';
import React, { ReactNode, useCallback, useState } from 'react';
import { IMG_EXTENSIONS, IMG_EXTENSIONS_TYPE } from 'src/api/file';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, Checkbox, IconSet, Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';

// ---------------------------------------------------------------------------
// Extension groups
// Each extension in IMG_EXTENSIONS must appear in exactly one group.
// Add new extensions here when extending IMG_EXTENSIONS in src/api/file.ts.
// ---------------------------------------------------------------------------

type ExtensionGroup = {
  label: string;
  description?: string;
  extensions: IMG_EXTENSIONS_TYPE[];
};

const EXTENSION_GROUPS: ExtensionGroup[] = [
  {
    label: 'Images',
    extensions: [
      'gif', 'png', 'apng', 'jpg', 'jpeg', 'jfif',
      'webp', 'avif', 'bmp', 'ico', 'svg',
      'tif', 'tiff',
      'psd', 'kra',
      'exr',
    ],
  },
  {
    label: 'Video',
    extensions: ['mp4', 'webm', 'ogg'],
  },
  {
    label: 'Audio',
    description: 'Indexed and taggable — shown with a placeholder thumbnail, no playback',
    extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'wma'],
  },
  {
    label: '3D / Project Files',
    description: 'Indexed and taggable — shown with a placeholder thumbnail',
    extensions: ['blend'],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ImageFormatPicker = observer(() => {
  const { locationStore, fileStore } = useStore();

  const [removeDisabledFiles, setRemoveDisabledFiles] = useState(true);
  const toggleRemoveDisabledFiles = useCallback(() => setRemoveDisabledFiles((val) => !val), []);

  const [newEnabledFileExtensions, setNewEnabledFileExtensions] = useState(
    new Set(locationStore.enabledFileExtensions),
  );

  const toggleExtension = useCallback(
    (ext: IMG_EXTENSIONS_TYPE) => {
      const next = new Set(newEnabledFileExtensions);
      if (next.has(ext)) {
        next.delete(ext);
      } else {
        next.add(ext);
      }
      setNewEnabledFileExtensions(next);
    },
    [newEnabledFileExtensions],
  );

  const toggleGroup = useCallback(
    (group: ExtensionGroup) => {
      const next = new Set(newEnabledFileExtensions);
      const allEnabled = group.extensions.every((ext) => next.has(ext));
      if (allEnabled) {
        group.extensions.forEach((ext) => next.delete(ext));
      } else {
        group.extensions.forEach((ext) => next.add(ext));
      }
      setNewEnabledFileExtensions(next);
    },
    [newEnabledFileExtensions],
  );

  const onSubmit = useCallback(async () => {
    if (removeDisabledFiles) {
      const extensionsToDelete = IMG_EXTENSIONS.filter((ext) => !newEnabledFileExtensions.has(ext));
      for (const ext of extensionsToDelete) {
        await fileStore.deleteFilesByExtension(ext);
      }
    }

    locationStore.setSupportedImageExtensions(newEnabledFileExtensions);

    window.alert('Allusion will restart to load your new preferences.');
    RendererMessenger.reload();
  }, [fileStore, locationStore, newEnabledFileExtensions, removeDisabledFiles]);

  const isUnchanged =
    newEnabledFileExtensions.size === locationStore.enabledFileExtensions.size &&
    Array.from(newEnabledFileExtensions.values()).every((ext) =>
      locationStore.enabledFileExtensions.has(ext),
    );

  return (
    <>
      <p className="settings-section-description">
        Choose which file types Allusion discovers and indexes in your Locations.
        Changes take effect after restarting the app.
      </p>

      {EXTENSION_GROUPS.map((group) => {
        const allEnabled = group.extensions.every((ext) => newEnabledFileExtensions.has(ext));
        const someEnabled = !allEnabled && group.extensions.some((ext) => newEnabledFileExtensions.has(ext));

        return (
          <fieldset key={group.label} className="format-group">
            <legend>
              <Checkbox
                checked={allEnabled}
                onChange={() => toggleGroup(group)}
                // "indeterminate" styling hint when some but not all are checked
                data-indeterminate={someEnabled ? 'true' : undefined}
              >
                <strong>{group.label}</strong>
              </Checkbox>
            </legend>

            {group.description && (
              <p className="format-group-description">{group.description}</p>
            )}

            <div className="checkbox-set-container">
              {group.extensions.map((ext) => (
                <Checkbox
                  key={ext}
                  checked={newEnabledFileExtensions.has(ext)}
                  onChange={() => toggleExtension(ext)}
                >
                  {ext}
                  {extensionHints[ext] && <> {extensionHints[ext]}</>}
                </Checkbox>
              ))}
            </div>
          </fieldset>
        );
      })}

      <Toggle checked={removeDisabledFiles} onChange={toggleRemoveDisabledFiles}>
        Remove files with disabled extensions from library after save
      </Toggle>

      <div className="settings-actions">
        <Button
          text="Reset"
          onClick={() => setNewEnabledFileExtensions(new Set(locationStore.enabledFileExtensions))}
        />
        <Button
          text="Save"
          styling="filled"
          onClick={onSubmit}
          disabled={newEnabledFileExtensions.size === 0 || isUnchanged}
        />
      </div>
    </>
  );
});

// ---------------------------------------------------------------------------
// Per-extension hints shown next to the checkbox label
// ---------------------------------------------------------------------------

const extensionHints: Partial<Record<IMG_EXTENSIONS_TYPE, ReactNode>> = {
  exr: (
    <span
      title="Experimental: May slow down the application when enabled (disabled by default)"
      className="info-icon"
    >
      {IconSet.WARNING}
    </span>
  ),
  mp3: <span className="format-tag">placeholder</span>,
  wav: <span className="format-tag">placeholder</span>,
  flac: <span className="format-tag">placeholder</span>,
  aac: <span className="format-tag">placeholder</span>,
  m4a: <span className="format-tag">placeholder</span>,
  opus: <span className="format-tag">placeholder</span>,
  wma: <span className="format-tag">placeholder</span>,
  blend: <span className="format-tag">placeholder</span>,
};