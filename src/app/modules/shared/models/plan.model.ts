import { AuditModel } from "./audit.model";

export interface PlanModel extends AuditModel {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
}
