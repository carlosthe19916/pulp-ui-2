import { createContext } from "react";
import type { ReactNode } from "react";

export type NotificationVariant =
  "success" | "danger" | "warning" | "info" | "custom";

export interface Notification {
  id: number;
  title: string;
  variant: NotificationVariant;
  description?: ReactNode;
}

export interface NotificationsContextValue {
  addNotification: (notification: Omit<Notification, "id">) => void;
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);
