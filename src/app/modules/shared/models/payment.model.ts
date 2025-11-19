import { AuditModel } from "./audit.model";

/** Para crear un pago */
export interface PaymentCreateDTO {
  planId: string;
  planName: string;
  amount: number;
  credits: number;
  userId: string;
  userEmail: string;
  userFullName?: string;
  userPhone?: string;
}

/** Para actualizar un pago */
export type PaymentUpdateDTO = Partial<{
  status: PaymentStatus;
  wompiTransactionId: string;
  wompiReference: string;
  errorMessage: string;
}>;

/** Estados posibles de un pago */
export type PaymentStatus =
  | 'pending'     // Pendiente de pago
  | 'processing'  // Procesando en Wompi
  | 'approved'    // Pago exitoso
  | 'rejected'    // Pago rechazado
  | 'cancelled'   // Pago cancelado
  | 'error';      // Error en el proceso

/** Documento completo de pago en Firestore */
export interface PaymentModel extends AuditModel {
  id: string;
  planId: string;
  userId: string;
  userEmail: string;
  userFullName?: string;
  userPhone?: string;
  amount: number;
  credits: number;
  status: PaymentStatus;
  wompiTransactionId?: string;
  wompiReference?: string;
  errorMessage?: string;
}
