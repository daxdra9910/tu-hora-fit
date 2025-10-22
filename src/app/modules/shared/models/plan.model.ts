import { StateEnum } from "../enums/state.enum";
import { AuditModel } from "./audit.model";

/** Campos comunes del plan (sin id ni auditoría) */
export interface PlanBase {
  name: string;
  creditsTotal: number;        // ← reemplaza duration
  price: number;
  description?: string;
  state: StateEnum;
}

/** Para crear */
export type PlanCreateDTO = PlanBase;

/** Para actualizar (parcial) */
export type PlanUpdateDTO = Partial<PlanBase>;

/** Documento completo guardado */
export interface PlanModel extends AuditModel, PlanBase {
  id: string;
}
