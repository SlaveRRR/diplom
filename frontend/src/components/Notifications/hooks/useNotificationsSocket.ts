import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { BACKEND_URL, LS_ACCESS_TOKEN } from '@constants';
import { NotificationItem, NotificationListResponse } from '@types';

import { NOTIFICATIONS_QUERY_KEY } from './useNotificationsQuery';

type NotificationSocketMessage = {
  event: 'notification.created';
  notification: NotificationItem;
  unreadCount: number;
};

type UseNotificationsSocketOptions = {
  onCreated?: (notification: NotificationItem) => void;
};

const readStoredToken = () => {
  const rawToken = window.localStorage.getItem(LS_ACCESS_TOKEN);

  if (!rawToken) {
    return null;
  }

  try {
    return JSON.parse(rawToken) as string;
  } catch {
    return rawToken;
  }
};

const buildNotificationsSocketUrl = (token: string) => {
  const baseUrl = BACKEND_URL || window.location.origin;
  const socketUrl = new URL(baseUrl);

  socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  socketUrl.pathname = '/ws/notifications/';
  socketUrl.search = `token=${encodeURIComponent(token)}`;

  return socketUrl.toString();
};

const mergeNotification = (
  currentData: NotificationListResponse | undefined,
  notification: NotificationItem,
  unreadCount: number,
): NotificationListResponse => {
  const existingItems = currentData?.items ?? [];
  const itemsWithoutDuplicate = existingItems.filter((item) => item.id !== notification.id);

  return {
    unreadCount,
    items: [notification, ...itemsWithoutDuplicate].slice(0, 50),
  };
};

export const useNotificationsSocket = (enabled: boolean, options?: UseNotificationsSocketOptions) => {
  const queryClient = useQueryClient();
  const onCreated = options?.onCreated;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    let socket: WebSocket | null = null;
    let reconnectTimeoutId: number | null = null;
    let isUnmounted = false;

    const connect = () => {
      const token = readStoredToken();

      if (!token) {
        return;
      }

      socket = new WebSocket(buildNotificationsSocketUrl(token));

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as NotificationSocketMessage;

          if (payload.event !== 'notification.created') {
            return;
          }

          queryClient.setQueryData<NotificationListResponse | undefined>([NOTIFICATIONS_QUERY_KEY], (currentData) =>
            mergeNotification(currentData, payload.notification, payload.unreadCount),
          );
          onCreated?.(payload.notification);
        } catch {
          queryClient.invalidateQueries([NOTIFICATIONS_QUERY_KEY]);
        }
      };

      socket.onclose = () => {
        if (isUnmounted) {
          return;
        }

        reconnectTimeoutId = window.setTimeout(connect, 2500);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      isUnmounted = true;

      if (reconnectTimeoutId) {
        window.clearTimeout(reconnectTimeoutId);
      }

      socket?.close();
    };
  }, [enabled, onCreated, queryClient]);
};
