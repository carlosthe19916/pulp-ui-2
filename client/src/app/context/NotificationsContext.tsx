import React, { createContext, useCallback, useContext, useState } from "react";

import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  type AlertVariant,
} from "@patternfly/react-core";

interface Notification {
  id: number;
  title: string;
  variant: AlertVariant;
  description?: string;
}

interface NotificationsContextValue {
  addNotification: (notification: Omit<Notification, "id">) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
};

let notificationId = 0;

export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = ++notificationId;
      setNotifications((prev) => [...prev, { ...notification, id }]);
      setTimeout(() => removeNotification(id), 8000);
    },
    [removeNotification],
  );

  return (
    <NotificationsContext.Provider value={{ addNotification }}>
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
    </NotificationsContext.Provider>
  );
};
