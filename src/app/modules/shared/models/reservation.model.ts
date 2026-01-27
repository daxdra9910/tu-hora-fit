import { AuditModel } from "./audit.model";

export interface ReservationModel extends AuditModel {
  // 🔙 campos legacy (ya existen en Firestore)
  user_id?: string;
  schedule_class_id?: string;

  // ✅ campos nuevos y consistentes
  userId?: string;
  scheduleClassId?: string;

  date: Date;
  status?: 'active' | 'cancelled' | 'attended' | 'missed';
}


export interface ReservationModelWithId extends ReservationModel {
  id: string;
}
