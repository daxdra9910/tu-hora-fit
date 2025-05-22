import { RecurrenceEnum } from "../enums/recurrence.enum";
import { AuditModel } from "./audit.model";

export interface ScheduleClassModel extends AuditModel {
  class_id: string;
  employee_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  max_capacity: number;
  recurrence: RecurrenceEnum;
  recurrence_days?: string[];
  active: boolean;
}

export interface ScheduleClassModelWithId extends ScheduleClassModel {
  id: string;
}