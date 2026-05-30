import { Button, Flex } from 'antd';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

type OnboardingStorage = 'local' | 'session';

type UsePageOnboardingOptions = {
  storageKey: string;
  enabled?: boolean;
  storage?: OnboardingStorage;
};

const getStorage = (storage: OnboardingStorage) => (storage === 'local' ? window.localStorage : window.sessionStorage);

export const usePageOnboarding = ({ storageKey, enabled = true, storage = 'local' }: UsePageOnboardingOptions) => {
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

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const skip = useCallback(() => {
    storageApi?.setItem(storageKey, 'true');
    setIsOpen(false);
  }, [storageApi, storageKey]);
  const reset = useCallback(() => {
    storageApi?.removeItem(storageKey);
    setIsOpen(true);
  }, [storageApi, storageKey]);

  const actionsRender = useCallback(
    (originNode: ReactNode) => (
      <Flex className="max-w-62.5 sm:max-w-none" gap={8} justify="center" align="center" wrap>
        <Button type="text" size="small" onClick={skip}>
          Пропустить
        </Button>
        {originNode}
      </Flex>
    ),
    [skip],
  );

  const tourProps = useMemo(
    () => ({
      actionsRender,
      onClose: close,
      open: isOpen,
    }),
    [actionsRender, close, isOpen],
  );

  return {
    actionsRender,
    isOpen,
    close,
    open,
    reset,
    skip,
    tourProps,
  };
};
