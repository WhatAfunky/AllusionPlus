import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import { RendererMessenger } from 'src/ipc/renderer';
import { Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';

export const StartupBehavior = observer(() => {
  const { uiStore } = useStore();

  const [isAutoUpdateEnabled, setAutoUpdateEnabled] = useState(
    RendererMessenger.isCheckUpdatesOnStartupEnabled,
  );

  const toggleAutoUpdate = useCallback(() => {
    RendererMessenger.toggleCheckUpdatesOnStartup();
    setAutoUpdateEnabled((isOn) => !isOn);
  }, []);

  return (
    <div className="vstack">
      <Toggle
        checked={uiStore.isRememberSearchEnabled}
        onChange={uiStore.toggleRememberSearchQuery}
      >
        Restore and query last submitted search query
      </Toggle>
      <Toggle
        checked={uiStore.isRefreshLocationsStartupEnabled}
        onChange={uiStore.toggleRefreshLocationStartup}
      >
        Refresh Non Auto-Synced Locations and Detect File Changes
      </Toggle>
      <Toggle
        checked={uiStore.isNotifyOnNewFilesEnabled}
        onChange={uiStore.toggleNotifyOnNewFiles}
      >
        Notify me about new files instead of refreshing the gallery automatically
      </Toggle>
      <Toggle
        checked={uiStore.isRefreshActiveLocationOnFocusEnabled}
        onChange={uiStore.toggleRefreshActiveLocationOnFocus}
      >
        Check the current location for new files when the window regains focus
      </Toggle>
      <br />
      <Toggle checked={isAutoUpdateEnabled} onChange={toggleAutoUpdate}>
        Check for updates
      </Toggle>
    </div>
  );
});
