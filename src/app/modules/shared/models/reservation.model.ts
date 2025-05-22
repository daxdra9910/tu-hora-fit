import { AuditModel } from "./audit.model";

export interface ReservationModel extends AuditModel {
  user_id: string;
  schedule_class_id: string;
  date: Date;
}

export interface ReservationModelWithId extends ReservationModel {
  id: string;
}