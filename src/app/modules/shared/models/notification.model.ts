export interface NotificationModel {
  id?: string;
  title?: string;
  message?: string;     // mapped from service.body
  sentBy?: string;      // mapped from service.createdBy
  date?: Date | null;   // mapped/converted from service.createdAt
  broadcast?: boolean;
  targetUserIds?: string[];
  hiddenBy?: string[];
}
