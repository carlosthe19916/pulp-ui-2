import React, { useCallback, useState } from "react";

import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";

import {
  NotificationsContext,
  type INotification,
} from "./notifications-context";

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
      setTimeout(() => removeNotification(id), 8000);
    },
    [removeNotification],
  );

  return (
    <NotificationsContext value={{ addNotification }}>
      {children}
      <AlertGroup isToast isLiveRegion>
        {notifications.map((n) => (
          <Alert
            key={n.id}
            variant={n.variant}
            title={n.title}
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
