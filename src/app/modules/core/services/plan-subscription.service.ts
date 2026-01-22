// src/app/core/services/plan-subscription.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { PlanModel } from '../../shared/models/plan.model';
import { PaymentCreateDTO, PaymentStatus, PaymentUpdateDTO } from '../../shared/models/payment.model';
import { UserCredits } from './credits.service';
import { PlansService } from './plans.service';
import { CreditsService } from './credits.service';
import { PaymentsService } from './payments.service';

export interface PlanChangeSimulation {
  canChange: boolean;
  message?: string;
  currentPlan?: PlanModel;
  currentCredits: UserCredits | null;
  daysUsed: number;
  daysRemaining: number;
  creditsUsed: number;
  creditsRemaining: number;
  newPlan: PlanModel;
  proratedAmount: number;
  dailyRateOldPlan: number;
  dailyRateNewPlan: number;
  pendingValueOldPlan: number;
  amountToPay: number;
  hasCredit: boolean;
  transferableCredits: number;
  creditsToAdd: number;
  summary: {
    description: string;
    oldPlanSummary: string;
    newPlanSummary: string;
    paymentSummary?: string;
    creditSummary?: string;
  };
}

export interface PlanChangeExecutionResult {
  success: boolean;
  message: string;
  newPaymentId?: string;
  transactionId?: string;
  newCreditsBalance: number;
  newExpiryDate: Date;
}

@Injectable({ providedIn: 'root' })
export class PlanSubscriptionService {
  private firestore = inject(Firestore);
  private plansService = inject(PlansService);
  private creditsService = inject(CreditsService);
  private paymentsService = inject(PaymentsService);

  private readonly DEFAULT_PLAN_DAYS = 30;

  // ==================== CÁLCULO DE PRORRATEO ====================

  calculateDaysUsed(startDate: Date | string, currentDate: Date = new Date()): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;

    if (!start || isNaN(start.getTime())) {
      throw new Error('Fecha de inicio inválida');
    }

    const diffTime = currentDate.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, Math.min(diffDays, this.DEFAULT_PLAN_DAYS));
  }

  calculateDaysRemaining(startDate: Date | string, currentDate: Date = new Date()): number {
    const daysUsed = this.calculateDaysUsed(startDate, currentDate);
    return Math.max(0, this.DEFAULT_PLAN_DAYS - daysUsed);
  }

  calculateProratedAmount(
    oldPlanPrice: number,
    newPlanPrice: number,
    daysUsed: number
  ): number {
    if (daysUsed < 0 || daysUsed > this.DEFAULT_PLAN_DAYS) {
      throw new Error('Días usados inválidos');
    }

    if (oldPlanPrice < 0 || newPlanPrice < 0) {
      throw new Error('Precios no pueden ser negativos');
    }

    const dailyRateOld = oldPlanPrice / this.DEFAULT_PLAN_DAYS;
    const usedValue = daysUsed * dailyRateOld;
    const pendingValue = oldPlanPrice - usedValue;

    if (newPlanPrice > oldPlanPrice) {
      const difference = newPlanPrice - pendingValue;
      return Math.max(0, difference);
    }

    const credit = pendingValue - newPlanPrice;

    if (credit > 0) {
      return 0;
    }

    return Math.abs(credit);
  }

  calculateTransferableCredits(
    totalCredits: number,
    creditsUsed: number,
    daysUsed: number
  ): number {
    if (creditsUsed === 0) {
      return totalCredits;
    }

    const timeUsedRatio = daysUsed / this.DEFAULT_PLAN_DAYS;
    const expectedUsed = Math.floor(totalCredits * timeUsedRatio);
    const overUsed = Math.max(0, creditsUsed - expectedUsed);
    const transferable = totalCredits - creditsUsed - overUsed;

    return Math.max(0, transferable);
  }

  // ==================== SIMULACIÓN DE CAMBIO ====================

  async simulatePlanChange(
    userId: string,
    newPlanId: string
  ): Promise<PlanChangeSimulation> {
    try {
      const userCredits = await this.creditsService.getUserCredits(userId);

      if (!userCredits) {
        return this.createErrorSimulation('No tienes un plan activo', newPlanId);
      }

      if (!userCredits.activePlanId) {
        return this.createErrorSimulation('No tienes un plan activo', newPlanId);
      }

      const currentPlan = await this.plansService.getPlan(userCredits.activePlanId);
      const newPlan = await this.plansService.getPlan(newPlanId);

      if (!currentPlan || !newPlan) {
        return this.createErrorSimulation('Plan no encontrado', newPlanId);
      }

      if (currentPlan.id === newPlan.id) {
        return this.createErrorSimulation('Ya tienes este plan activo', newPlanId);
      }

      if (userCredits.planExpiryDate && new Date(userCredits.planExpiryDate) < new Date()) {
        return this.createErrorSimulation('Tu plan actual está expirado', newPlanId);
      }

      const daysUsed = this.calculateDaysUsed(userCredits.planStartDate || new Date());
      const daysRemaining = this.DEFAULT_PLAN_DAYS - daysUsed;
      const creditsUsed = userCredits.totalUsed || 0;
      const transferableCredits = this.calculateTransferableCredits(
        currentPlan.creditsTotal,
        creditsUsed,
        daysUsed
      );
      const creditsRemaining = Math.max(0, currentPlan.creditsTotal - creditsUsed);
      const proratedAmount = this.calculateProratedAmount(
        currentPlan.price,
        newPlan.price,
        daysUsed
      );
      const dailyRateOldPlan = currentPlan.price / this.DEFAULT_PLAN_DAYS;
      const dailyRateNewPlan = newPlan.price / this.DEFAULT_PLAN_DAYS;
      const pendingValueOldPlan = dailyRateOldPlan * daysRemaining;
      const hasCredit = proratedAmount <= 0;
      const amountToPay = hasCredit ? 0 : proratedAmount;
      const creditsToAdd = newPlan.creditsTotal;
      const summary = this.createChangeSummary(
        currentPlan,
        newPlan,
        daysUsed,
        daysRemaining,
        transferableCredits,
        amountToPay,
        hasCredit
      );

      return {
        canChange: true,
        currentPlan,
        currentCredits: userCredits,
        daysUsed,
        daysRemaining,
        creditsUsed,
        creditsRemaining,
        newPlan,
        proratedAmount,
        dailyRateOldPlan,
        dailyRateNewPlan,
        pendingValueOldPlan,
        amountToPay,
        hasCredit,
        transferableCredits,
        creditsToAdd,
        summary
      };

    } catch (error: any) {
      console.error('Error simulating plan change:', error);
      return this.createErrorSimulation(
        `Error al simular cambio: ${error.message}`,
        newPlanId
      );
    }
  }

  private createErrorSimulation(message: string, newPlanId: string): PlanChangeSimulation {
    return {
      canChange: false,
      message,
      currentCredits: null,
      daysUsed: 0,
      daysRemaining: 0,
      creditsUsed: 0,
      creditsRemaining: 0,
      newPlan: { id: newPlanId } as PlanModel,
      proratedAmount: 0,
      dailyRateOldPlan: 0,
      dailyRateNewPlan: 0,
      pendingValueOldPlan: 0,
      amountToPay: 0,
      hasCredit: false,
      transferableCredits: 0,
      creditsToAdd: 0,
      summary: {
        description: message,
        oldPlanSummary: '',
        newPlanSummary: ''
      }
    };
  }

  private createChangeSummary(
    currentPlan: PlanModel,
    newPlan: PlanModel,
    daysUsed: number,
    daysRemaining: number,
    transferableCredits: number,
    amountToPay: number,
    hasCredit: boolean
  ): PlanChangeSimulation['summary'] {
    const description = `Cambio de ${currentPlan.name} a ${newPlan.name}`;

    const oldPlanSummary = `
      Plan actual: ${currentPlan.name}
      Días usados: ${daysUsed} de ${this.DEFAULT_PLAN_DAYS}
      Días restantes: ${daysRemaining}
      Créditos transferibles: ${transferableCredits}
    `.trim();

    const newPlanSummary = `
      Nuevo plan: ${newPlan.name}
      Duración: ${this.DEFAULT_PLAN_DAYS} días
      Créditos incluidos: ${newPlan.creditsTotal}
      Precio: $${newPlan.price.toLocaleString('es-CO')}
    `.trim();

    let paymentSummary = '';
    let creditSummary = '';

    if (hasCredit) {
      creditSummary = '¡Tienes crédito a favor! No se requiere pago adicional.';
    } else if (amountToPay > 0) {
      paymentSummary = `Monto a pagar: $${amountToPay.toLocaleString('es-CO')}`;
    } else {
      paymentSummary = 'No se requiere pago adicional.';
    }

    return {
      description,
      oldPlanSummary,
      newPlanSummary,
      ...(paymentSummary && { paymentSummary }),
      ...(creditSummary && { creditSummary })
    };
  }

  // ==================== EJECUCIÓN DE CAMBIO ====================

  async executePlanChange(
    userId: string,
    newPlanId: string,
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet',
    adminId?: string,
    cashReceiptNumber?: string,
    notes?: string
  ): Promise<PlanChangeExecutionResult> {
    try {
      console.log(`🔄 Executing plan change for user ${userId} to plan ${newPlanId}`);

      const simulation = await this.simulatePlanChange(userId, newPlanId);

      if (!simulation.canChange || !simulation.currentPlan) {
        throw new Error(simulation.message || 'No se puede cambiar de plan');
      }

      const paymentData: PaymentCreateDTO = {
        planId: newPlanId,
        planName: simulation.newPlan.name,
        amount: simulation.amountToPay,
        credits: simulation.newPlan.creditsTotal,
        userId,
        userEmail: '', // Obtener del servicio de usuario
        userFullName: '', // Obtener del servicio de usuario
        userPhone: ''
      };

      const paymentId = await this.paymentsService.createPayment(paymentData);

      // 👇 CORRECCIÓN: Usar updatePayment() en lugar de updatePaymentStatus()
      const updateData: PaymentUpdateDTO = {
        status: 'approved',
        paymentMethod,
        activatedBy: adminId,
        activatedAt: new Date(),
        cashReceiptNumber,
        notes,
        previousPlanId: simulation.currentPlan.id, // ✅ Ahora está permitido
        proratedAmount: simulation.proratedAmount,
        remainingCreditsFromOldPlan: simulation.transferableCredits,
        isPlanChange: true
      };

      await this.paymentsService.updatePayment(paymentId, updateData);

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + this.DEFAULT_PLAN_DAYS);

      const currentBalance = await this.creditsService.getUserBalance(userId);
      const totalCreditsToAssign = simulation.newPlan.creditsTotal + simulation.transferableCredits;

      await this.creditsService.assignCreditsForPlanChange(
        userId,
        paymentId,
        simulation.newPlan.name,
        simulation.newPlan.creditsTotal,
        simulation.transferableCredits,
        this.DEFAULT_PLAN_DAYS,
        paymentMethod,
        newPlanId
      );

      const userCreditsRef = doc(this.firestore, 'userCredits', userId);
      await updateDoc(userCreditsRef, {
        activePlanId: newPlanId,
        planStartDate: serverTimestamp(),
        planExpiryDate: newExpiryDate,
        previousPlanId: simulation.currentPlan.id,
        lastPlanChange: serverTimestamp()
      });

      console.log(`✅ Plan change executed successfully for user ${userId}`);

      return {
        success: true,
        message: 'Plan cambiado exitosamente',
        newPaymentId: paymentId,
        newCreditsBalance: currentBalance + totalCreditsToAssign,
        newExpiryDate
      };

    } catch (error: any) {
      console.error('Error executing plan change:', error);
      return {
        success: false,
        message: `Error al cambiar de plan: ${error.message}`,
        newCreditsBalance: 0,
        newExpiryDate: new Date()
      };
    }
  }

  // ==================== EXPIRACIÓN Y RENOVACIÓN ====================

  async checkPlanExpiry(userId: string): Promise<{
    isExpired: boolean;
    expiresSoon: boolean;
    daysRemaining: number;
    expiryDate?: Date;
  }> {
    try {
      const userCredits = await this.creditsService.getUserCredits(userId);

      if (!userCredits || !userCredits.planExpiryDate) {
        return { isExpired: true, expiresSoon: false, daysRemaining: 0 };
      }

      const expiryDate = userCredits.planExpiryDate instanceof Date
        ? userCredits.planExpiryDate
        : new Date(userCredits.planExpiryDate);

      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isExpired = daysRemaining <= 0;
      const expiresSoon = daysRemaining <= 7 && daysRemaining > 0;

      return {
        isExpired,
        expiresSoon,
        daysRemaining: Math.max(0, daysRemaining),
        expiryDate
      };

    } catch (error) {
      console.error('Error checking plan expiry:', error);
      return { isExpired: true, expiresSoon: false, daysRemaining: 0 };
    }
  }

  async renewPlan(
    userId: string,
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet' = 'wompi'
  ): Promise<{ success: boolean; message: string; newPaymentId?: string }> {
    try {
      const userCredits = await this.creditsService.getUserCredits(userId);

      if (!userCredits || !userCredits.activePlanId) {
        throw new Error('Usuario no tiene un plan activo para renovar');
      }

      const currentPlan = await this.plansService.getPlan(userCredits.activePlanId);
      if (!currentPlan) {
        throw new Error('Plan actual no encontrado');
      }

      const paymentData: PaymentCreateDTO = {
        planId: currentPlan.id,
        planName: currentPlan.name,
        amount: currentPlan.price,
        credits: currentPlan.creditsTotal,
        userId,
        userEmail: '', // Obtener del usuario
        userFullName: '', // Obtener del usuario
      };

      const paymentId = await this.paymentsService.createPayment(paymentData);

      // 👇 CORRECCIÓN: Usar updatePayment() en lugar de updatePaymentStatus()
      await this.paymentsService.updatePayment(paymentId, {
        status: 'approved',
        paymentMethod,
        isAutoRenewal: true, // ✅ Ahora está permitido
        notes: 'Renovación automática de plan'
      });

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + this.DEFAULT_PLAN_DAYS);

      const currentBalance = await this.creditsService.getUserBalance(userId);
      const creditsToAssign = currentBalance > 0 ? 0 : currentPlan.creditsTotal;

      await this.creditsService.assignCreditsFromPayment(
        userId,
        paymentId,
        `${currentPlan.name} (Renovación)`,
        creditsToAssign,
        this.DEFAULT_PLAN_DAYS,
        paymentMethod,
        newExpiryDate
      );

      return {
        success: true,
        message: 'Plan renovado exitosamente',
        newPaymentId: paymentId
      };

    } catch (error: any) {
      console.error('Error renewing plan:', error);
      return {
        success: false,
        message: `Error al renovar plan: ${error.message}`
      };
    }
  }

  // ==================== ADMIN: ACTIVAR PLAN EN EFECTIVO ====================

  async adminActivatePlan(
    userId: string,
    planId: string,
    adminId: string,
    adminName: string,
    cashReceiptNumber?: string,
    notes?: string
  ): Promise<PlanChangeExecutionResult> {
    try {
      return await this.executePlanChange(
        userId,
        planId,
        'cash_admin',
        adminId,
        cashReceiptNumber,
        notes
      );

    } catch (error: any) {
      console.error('Error activating plan as admin:', error);
      return {
        success: false,
        message: `Error al activar plan: ${error.message}`,
        newCreditsBalance: 0,
        newExpiryDate: new Date()
      };
    }
  }

  // ==================== VALIDACIONES ====================

  async canUserReserve(userId: string): Promise<{
    canReserve: boolean;
    message?: string;
    creditsAvailable: number;
    planActive: boolean;
  }> {
    try {
      const userCredits = await this.creditsService.getUserCredits(userId);
      const balance = await this.creditsService.getUserBalance(userId);

      if (!userCredits) {
        return {
          canReserve: false,
          message: 'No tienes un plan activo',
          creditsAvailable: 0,
          planActive: false
        };
      }

      const expiryCheck = await this.checkPlanExpiry(userId);
      if (expiryCheck.isExpired) {
        return {
          canReserve: false,
          message: 'Tu plan ha expirado',
          creditsAvailable: balance,
          planActive: false
        };
      }

      if (balance <= 0) {
        return {
          canReserve: false,
          message: 'No tienes créditos disponibles',
          creditsAvailable: 0,
          planActive: true
        };
      }

      return {
        canReserve: true,
        creditsAvailable: balance,
        planActive: true
      };

    } catch (error) {
      console.error('Error checking if user can reserve:', error);
      return {
        canReserve: false,
        message: 'Error al verificar estado del plan',
        creditsAvailable: 0,
        planActive: false
      };
    }
  }
}
