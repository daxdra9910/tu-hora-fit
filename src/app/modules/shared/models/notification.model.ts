import { AuditModel } from "./audit.model";

export interface NotificationModel extends AuditModel {
  id: string;
  title: string;
  message: string;
  date: Date;
  sentBy: string;
}
