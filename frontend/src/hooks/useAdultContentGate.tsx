import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LS_ADULT_CONTENT_CONFIRMED } from '@constants';
import { AdultContentConfirmModal } from '@components/shared/AdultContentConfirmModal';

type GuardEvent = {
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

type GuardRequest = {
  href: string;
  ageRating?: string | null;
};

const isAdultAgeRating = (ageRating?: string | null) => ageRating === '18+';
const ADULT_CONTENT_CONFIRMED_EVENT = 'adult-content-confirmed-changed';

const readAdultContentConfirmed = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(LS_ADULT_CONTENT_CONFIRMED) === 'true';
};

export const useAdultContentGate = () => {
  const navigate = useNavigate();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isAdultContentConfirmed, setIsAdultContentConfirmed] = useState<boolean>(() => readAdultContentConfirmed());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncConfirmation = () => {
      setIsAdultContentConfirmed(readAdultContentConfirmed());
    };

    window.addEventListener(ADULT_CONTENT_CONFIRMED_EVENT, syncConfirmation);
    window.addEventListener('storage', syncConfirmation);

    return () => {
      window.removeEventListener(ADULT_CONTENT_CONFIRMED_EVENT, syncConfirmation);
      window.removeEventListener('storage', syncConfirmation);
    };
  }, []);

  const guardNavigation = useCallback(
    ({ href, ageRating }: GuardRequest, event?: GuardEvent) => {
      if (!isAdultAgeRating(ageRating) || isAdultContentConfirmed) {
        if (!event) {
          navigate(href);
        }
        return;
      }

      event?.preventDefault?.();
      event?.stopPropagation?.();
      setPendingHref(href);
    },
    [isAdultContentConfirmed, navigate],
  );

  const handleConfirm = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_ADULT_CONTENT_CONFIRMED, 'true');
      window.dispatchEvent(new Event(ADULT_CONTENT_CONFIRMED_EVENT));
    }

    setIsAdultContentConfirmed(true);

    if (pendingHref) {
      navigate(pendingHref);
    }

    setPendingHref(null);
  }, [navigate, pendingHref]);

  const handleCancel = useCallback(() => {
    setPendingHref(null);
  }, []);

  return {
    guardNavigation,
    isAdultContentConfirmed,
    adultContentModal: (
      <AdultContentConfirmModal open={Boolean(pendingHref)} onConfirm={handleConfirm} onCancel={handleCancel} />
    ),
  };
};
