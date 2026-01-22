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

/** Para actualizar un pago - VERSIÓN COMPLETA */
export type PaymentUpdateDTO = Partial<{
  // Estado básico
  status: PaymentStatus;
  paymentMethod: 'wompi' | 'cash_admin' | 'wallet';

  // Datos de Wompi
  wompiTransactionId?: string;
  wompiReference?: string;
  errorMessage?: string;

  // Para pagos en efectivo por admin
  activatedBy?: string;
  activatedAt?: Date;
  cashReceiptNumber?: string;
  notes?: string;

  // Para cambios de plan
  isPlanChange?: boolean;
  previousPlanId?: string;
  proratedAmount?: number;
  remainingCreditsFromOldPlan?: number;

  // Para renovaciones automáticas
  isAutoRenewal?: boolean;

  // Fechas de plan
  planStartDate?: Date;
  planExpiryDate?: Date;

  // Facturación
  invoiceNumber?: string;
  taxAmount?: number;
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

  // 👇 MÉTODO DE PAGO (REQUERIDO)
  paymentMethod: 'wompi' | 'cash_admin' | 'wallet';

  // 👇 PARA PAGOS EN EFECTIVO POR ADMIN
  activatedBy?: string;
  activatedAt?: Date;
  cashReceiptNumber?: string;
  notes?: string;

  // 👇 PARA CAMBIOS DE PLAN
  isPlanChange?: boolean;
  previousPlanId?: string;
  proratedAmount?: number;
  remainingCreditsFromOldPlan?: number;

  // 👇 PARA RENOVACIONES AUTOMÁTICAS
  isAutoRenewal?: boolean;

  // 👇 EXPIRACIÓN Y VIGENCIA
  planStartDate?: Date;
  planExpiryDate?: Date;

  // 👇 DATOS DE WOMPI
  wompiTransactionId?: string;
  wompiReference?: string;
  errorMessage?: string;

  // 👇 PARA REPORTES Y SEGUIMIENTO
  invoiceNumber?: string;
  taxAmount?: number;
}

/** DTO específico para pago en efectivo por admin */
export interface CashPaymentCreateDTO {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  credits: number;
  adminId: string;
  adminName: string;
  cashReceiptNumber?: string;
  notes?: string;
  userEmail: string;
  userFullName?: string;
}

/** DTO específico para cambio de plan */
export interface PlanChangeCreateDTO {
  userId: string;
  currentPlanId: string;
  newPlanId: string;
  paymentMethod: 'wompi' | 'cash_admin' | 'wallet';
  reason?: string;
  adminId?: string;
}
