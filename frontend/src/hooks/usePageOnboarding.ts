import { useEffect, useMemo, useState } from 'react';

type OnboardingStorage = 'local' | 'session';

type UsePageOnboardingOptions = {
  storageKey: string;
  enabled?: boolean;
  storage?: OnboardingStorage;
};

const getStorage = (storage: OnboardingStorage) => (storage === 'local' ? window.localStorage : window.sessionStorage);

export const usePageOnboarding = ({ storageKey, enabled = true, storage = 'session' }: UsePageOnboardingOptions) => {
  const [isOpen, setIsOpen] = useState(false);

  const storageApi = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return getStorage(storage);
  }, [storage]);

  useEffect(() => {
    if (!enabled || !storageApi) {
      return;
    }

    const isShown = storageApi.getItem(storageKey);

    if (!isShown) {
      setIsOpen(true);
      storageApi.setItem(storageKey, 'true');
    }
  }, [enabled, storageApi, storageKey]);

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);
  const reset = () => {
    storageApi?.removeItem(storageKey);
    setIsOpen(true);
  };

  return {
    isOpen,
    close,
    open,
    reset,
  };
};
