import { StateEnum } from "../enums/state.enum";
import { AuditModel } from "./audit.model";

export interface PlanModel extends AuditModel {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string
  state: StateEnum;

}
