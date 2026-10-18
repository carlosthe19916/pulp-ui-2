import { createContext } from "react";
import type { ReactNode } from "react";

export type NotificationVariant =
  "success" | "danger" | "warning" | "info" | "custom";

export interface INotification {
  id: number;
  title: string;
  variant: NotificationVariant;
  description?: ReactNode;
}

export interface INotificationsContextValue {
  addNotification: (notification: Omit<INotification, "id">) => void;
}

export const NotificationsContext =
  createContext<INotificationsContextValue | null>(null);
