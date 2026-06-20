import { useEffect } from 'react';

type UseContentProtectionOptions = {
  blockScreenshots?: boolean;
};

const isBlockedDevToolsShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  return (
    event.key === 'F12' ||
    (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
    (event.ctrlKey && key === 'u')
  );
};

const isBlockedScreenshotShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  return (
    event.key === 'PrintScreen' ||
    ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 's') ||
    (event.metaKey && event.shiftKey && ['3', '4', '5'].includes(key))
  );
};

export const useContentProtection = ({ blockScreenshots = false }: UseContentProtectionOptions = {}) => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isBlockedDevToolsShortcut(event) || (blockScreenshots && isBlockedScreenshotShortcut(event))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (blockScreenshots && event.key === 'PrintScreen') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [blockScreenshots]);
};
