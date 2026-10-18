import React, { useCallback, useMemo, useState } from "react";

import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";

import {
  NotificationsContext,
  type INotification,
} from "./NotificationsContext";

let notificationId = 0;

export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<INotification, "id">) => {
      const id = ++notificationId;
      setNotifications((prev) => [...prev, { ...notification, id }]);
    },
    [],
  );

  const value = useMemo(() => ({ addNotification }), [addNotification]);

  return (
    <NotificationsContext value={value}>
      {children}
      <AlertGroup isToast isLiveRegion>
        {notifications.map((n) => (
          <Alert
            key={n.id}
            variant={n.variant}
            title={n.title}
            timeout={8000}
            onTimeout={() => removeNotification(n.id)}
            actionClose={
              <AlertActionCloseButton
                onClose={() => removeNotification(n.id)}
              />
            }
          >
            {n.description}
          </Alert>
        ))}
      </AlertGroup>
    </NotificationsContext>
  );
};
