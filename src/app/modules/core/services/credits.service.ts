import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  increment,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';

export interface CreditTransaction {
  id?: string;
  userId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'plan_change' | 'expiration';
  amount: number;
  description: string;
  reference?: string;
  createdAt: any;
  balanceAfter: number;
  expiresAt?: Date;
  planId?: string;
  paymentMethod?: 'wompi' | 'cash_admin' | 'wallet' | 'transfer' | 'admin';
}

export interface UserCredits {
  userId: string;
  balance: number;
  lastUpdated: any;
  totalEarned: number;
  totalUsed: number;

  activePlanId?: string;
  planName?: string;
  planStartDate?: Date;
  planExpiryDate?: Date;
  creditsExpiryDate?: Date;
  planCredits?: number;

  paymentMethod?: 'wompi' | 'cash_admin' | 'wallet' | 'transfer' | 'admin';
  previousPlanId?: string;
  isExpired?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CreditsService {
  private firestore = inject(Firestore);

  private readonly creditsColl = 'userCredits';
  private readonly transactionsColl = 'creditTransactions';

  // ==================== MÉTODO CORREGIDO: assignCreditsFromPayment ====================
  async assignCreditsFromPayment(
    userId: string,
    paymentId: string,
    planName: string,
    creditsAmount: number,
    expiresInDays: number = 30,
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet' = 'wompi',
    customExpiryDate?: Date,
    planId?: string
  ): Promise<void> {
    try {
      // 1. OBTENER CRÉDITOS ACTUALES DEL USUARIO
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);
      const existingData = userCreditsSnap.exists() ? userCreditsSnap.data() : null;

      const currentPlanId = existingData?.['activePlanId'];
      const currentBalance = Number(existingData?.['balance']) || 0;
      const currentPlanExpiryDate = existingData?.['planExpiryDate']?.toDate?.();
      const currentPlanName = existingData?.['planName'];

      const now = new Date();

      // 2. VALIDACIONES ESTRICTAS
      const validationResult = this.canUserPurchasePlan(
        currentPlanId,
        currentBalance,
        currentPlanExpiryDate,
        planId
      );

      if (!validationResult.allowed) {
        throw new Error(validationResult.reason);
      }

      // 3. CALCULAR FECHAS DE EXPIRACIÓN
      const expiresAt = customExpiryDate || this.calculateExpiryDate(expiresInDays);
      const planExpiryDate = expiresAt;

      // 4. DETERMINAR TIPO DE OPERACIÓN
      let newBalance: number;
      let newTotalEarned: number;
      let transactionType: CreditTransaction['type'] = 'purchase';
      let transactionDescription = `Compra de plan: ${planName}`;

      if (validationResult.type === 'renewal') {
        // RENOVACIÓN DEL MISMO PLAN
        newBalance = currentBalance + creditsAmount;
        newTotalEarned = (Number(existingData?.['totalEarned']) || 0) + creditsAmount;
        transactionDescription = `Renovación de plan: ${planName}`;
      }
      else if (validationResult.type === 'change' || validationResult.type === 'new') {
        // NUEVO PLAN o CAMBIO
        newBalance = creditsAmount;
        newTotalEarned = creditsAmount;

        if (currentPlanId && currentPlanId !== planId) {
          transactionType = 'plan_change';
          transactionDescription = `Cambio a plan: ${planName} (anterior: ${currentPlanName})`;
        }
      }

      const currentTotalUsed = Number(existingData?.['totalUsed']) || 0;

      // 5. PREPARAR DATOS PARA REEMPLAZO
      const updateData: any = {
        userId,
        balance: newBalance,
        planCredits: creditsAmount,
        lastUpdated: serverTimestamp(),
        totalEarned: newTotalEarned,
        totalUsed: currentTotalUsed,
        activePlanId: planId || paymentId,
        planName: planName || 'Plan sin nombre',
        planStartDate: serverTimestamp(),
        planExpiryDate: planExpiryDate,
        creditsExpiryDate: expiresAt,
        paymentMethod,
        isExpired: false,
      };

      // Solo guardar previousPlanId si hubo un cambio real de plan
      if (currentPlanId && currentPlanId !== planId && validationResult.type === 'change') {
        updateData.previousPlanId = currentPlanId;
      }

      // 6. GUARDAR EN FIRESTORE
      await setDoc(userCreditsRef, updateData);

      // 7. REGISTRAR TRANSACCIÓN
      await this.recordTransaction({
        userId,
        type: transactionType,
        amount: creditsAmount,
        description: transactionDescription,
        reference: paymentId,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance,
        expiresAt,
        planId: planId || paymentId,
        paymentMethod
      });

    } catch (error) {
      console.error('Error crítico en assignCreditsFromPayment:', error);
      throw new Error(`No se pudieron asignar los créditos: ${error.message}`);
    }
  }

  // ==================== MÉTODO DE VALIDACIÓN ====================
  private canUserPurchasePlan(
    currentPlanId: string | null | undefined,
    currentBalance: number,
    currentPlanExpiryDate: Date | null | undefined,
    newPlanId?: string
  ): { allowed: boolean; reason: string; type: 'new' | 'renewal' | 'change' | 'blocked' } {

    const now = new Date();
    const hasActivePlan = currentPlanId && currentPlanExpiryDate && currentPlanExpiryDate > now;
    const hasAvailableCredits = currentBalance > 0;

    // CASO 1: Usuario sin plan previo
    if (!currentPlanId) {
      return {
        allowed: true,
        reason: 'Usuario sin plan previo. Puede comprar nuevo plan.',
        type: 'new'
      };
    }

    // CASO 2: Plan expirado
    if (currentPlanExpiryDate && currentPlanExpiryDate <= now) {
      if (currentPlanId === newPlanId) {
        return {
          allowed: true,
          reason: 'Plan anterior expirado. Puede renovar el mismo plan.',
          type: 'renewal'
        };
      } else {
        return {
          allowed: true,
          reason: 'Plan anterior expirado. Puede cambiar a nuevo plan.',
          type: 'change'
        };
      }
    }

    // CASO 3: Plan activo pero sin créditos
    if (hasActivePlan && !hasAvailableCredits) {
      if (currentPlanId === newPlanId) {
        return {
          allowed: true,
          reason: 'Plan activo pero sin créditos. Puede renovar el mismo plan.',
          type: 'renewal'
        };
      } else {
        return {
          allowed: true,
          reason: 'Plan activo pero sin créditos. Puede cambiar a nuevo plan.',
          type: 'change'
        };
      }
    }

    // CASO 4: Plan activo CON créditos disponibles
    if (hasActivePlan && hasAvailableCredits) {
      if (currentPlanId === newPlanId) {
        return {
          allowed: false,
          reason: `Ya tienes el plan activo con ${currentBalance} créditos disponibles. No puedes renovar hasta que uses tus créditos o expire el plan.`,
          type: 'blocked'
        };
      } else {
        return {
          allowed: false,
          reason: `Ya tienes un plan activo con ${currentBalance} créditos disponibles. No puedes cambiar de plan hasta que uses tus créditos o expire el plan actual.`,
          type: 'blocked'
        };
      }
    }

    // CASO 5: Cualquier otro escenario
    return {
      allowed: true,
      reason: 'Condición especial permitida.',
      type: 'new'
    };
  }

  // ==================== MÉTODO: assignCreditsForPlanChange ====================
  async assignCreditsForPlanChange(
    userId: string,
    paymentId: string,

    newPlanName: string,
    newCreditsAmount: number,
    transferableCredits: number,
    expiresInDays: number = 30,
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet' = 'wompi',
    planId?: string
  ): Promise<void> {
    try {
      const expiresAt = this.calculateExpiryDate(expiresInDays);

      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      const currentBalance = userCreditsSnap.exists()
        ? (Number(userCreditsSnap.data()['balance']) || 0)
        : 0;

      const balanceFromTransfer = Math.min(currentBalance, transferableCredits);
      const newBalance = balanceFromTransfer + newCreditsAmount;

      const updateData: any = {
        userId,
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalEarned: userCreditsSnap.exists()
          ? (Number(userCreditsSnap.data()['totalEarned']) || 0) + newCreditsAmount
          : newCreditsAmount,
        totalUsed: userCreditsSnap.exists()
          ? (Number(userCreditsSnap.data()['totalUsed']) || 0)
          : 0,
        activePlanId: planId || paymentId,
        planName: newPlanName,
        planCredits: newCreditsAmount,
        planStartDate: serverTimestamp(),
        planExpiryDate: expiresAt,
        creditsExpiryDate: expiresAt,
        paymentMethod,
        isExpired: false
      };

      if (userCreditsSnap.exists() && userCreditsSnap.data()['activePlanId']) {
        updateData.previousPlanId = userCreditsSnap.data()['activePlanId'];
      }

      await setDoc(userCreditsRef, updateData);

      await this.recordTransaction({
        userId,
        type: 'plan_change',
        amount: newCreditsAmount,
        description: `Cambio a plan: ${newPlanName}`,
        reference: paymentId,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance,
        expiresAt,
        planId: planId || paymentId,
        paymentMethod
      });

      if (transferableCredits > 0) {
        await this.recordTransaction({
          userId,
          type: 'plan_change',
          amount: transferableCredits,
          description: `Créditos transferidos del plan anterior`,
          reference: paymentId,
          createdAt: serverTimestamp(),
          balanceAfter: newBalance,
          expiresAt,
          planId: planId || paymentId,
          paymentMethod: 'transfer'
        });
      }

    } catch (error) {
      console.error('Error assigning credits for plan change:', error);
      throw error;
    }
  }

  // ==================== MÉTODO: addManualCredits ====================
  async addManualCredits(
    userId: string,
    amount: number,
    description: string,
    adminId: string,
    expiresInDays: number = 30
  ): Promise<void> {
    try {
      const expiresAt = this.calculateExpiryDate(expiresInDays);
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      const currentBalance = userCreditsSnap.exists()
        ? (Number(userCreditsSnap.data()['balance']) || 0)
        : 0;

      const newBalance = currentBalance + amount;

      await setDoc(userCreditsRef, {
        userId,
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalEarned: userCreditsSnap.exists()
          ? (Number(userCreditsSnap.data()['totalEarned']) || 0) + amount
          : amount,
        totalUsed: userCreditsSnap.exists()
          ? (Number(userCreditsSnap.data()['totalUsed']) || 0)
          : 0,
        activePlanId: `admin_${adminId}_${Date.now()}`,
        planName: `Créditos manuales: ${description}`,
        planStartDate: serverTimestamp(),
        planExpiryDate: expiresAt,
        creditsExpiryDate: expiresAt,
        paymentMethod: 'admin',
        isExpired: false
      });

      await this.recordTransaction({
        userId,
        type: 'bonus',
        amount,
        description: `${description} (Admin: ${adminId})`,
        reference: `admin_${adminId}`,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance,
        expiresAt,
        paymentMethod: 'admin'
      });

    } catch (error) {
      console.error('Error adding manual credits:', error);
      throw error;
    }
  }

  // ==================== MÉTODO: useCredits ====================
  async useCredits(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<boolean> {
    try {
      const { availableBalance, hasActivePlan } = await this.getValidCredits(userId);

      if (!hasActivePlan) {
        throw new Error('No tienes un plan activo o ha expirado');
      }

      if (availableBalance < amount) {
        throw new Error('Créditos insuficientes');
      }

      const newBalance = availableBalance - amount;
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);

      await updateDoc(userCreditsRef, {
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalUsed: increment(amount)
      });

      await this.recordTransaction({
        userId,
        type: 'usage',
        amount: -amount,
        description,
        reference,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance
      });

      return true;

    } catch (error) {
      console.error('Error using credits:', error);
      throw error;
    }
  }

  // ==================== MÉTODO: refundCredits ====================
  async refundCredits(
    userId: string,
    amount: number,
    description: string,
    reference?: string,
    extendExpiry: boolean = false
  ): Promise<boolean> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const currentBalance = Number(userCreditsSnap.data()['balance']) || 0;
      const newBalance = currentBalance + amount;

      const updateData: any = {
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalEarned: increment(amount)
      };

      if (extendExpiry) {
        const currentExpiry = userCreditsSnap.data()['creditsExpiryDate'];
        if (currentExpiry) {
          const newExpiry = new Date(currentExpiry.toDate());
          newExpiry.setDate(newExpiry.getDate() + 1);
          updateData.creditsExpiryDate = newExpiry;
        }
      }

      await updateDoc(userCreditsRef, updateData);

      await this.recordTransaction({
        userId,
        type: 'refund',
        amount,
        description,
        reference,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance
      });

      return true;

    } catch (error) {
      console.error('Error refunding credits:', error);
      throw error;
    }
  }

  // ==================== CONSULTAS ====================
  async getValidCredits(userId: string): Promise<{
    availableBalance: number;
    hasActivePlan: boolean;
    planExpiryDate?: Date;
    daysRemaining: number;
  }> {
    try {
      const userCredits = await this.getUserCredits(userId);

      if (!userCredits) {
        return { availableBalance: 0, hasActivePlan: false, daysRemaining: 0 };
      }

      const now = new Date();
      let daysRemaining = 0;

      if (userCredits.planExpiryDate) {
        const expiryDate =
          userCredits.planExpiryDate instanceof Date
            ? userCredits.planExpiryDate
            : new Date(userCredits.planExpiryDate);

        daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 0) {
          await this.expireCreditsIfNeeded(userId);
          return { availableBalance: 0, hasActivePlan: false, daysRemaining: 0 };
        }
      }

      return {
        availableBalance: userCredits.balance, // 🔥 CLAVE
        hasActivePlan: userCredits.balance > 0,
        planExpiryDate: userCredits.planExpiryDate,
        daysRemaining: Math.max(0, daysRemaining)
      };

    } catch (error) {
      console.error('Error getting valid credits:', error);
      return { availableBalance: 0, hasActivePlan: false, daysRemaining: 0 };
    }
  }

  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) {
        return null;
      }

      const data = userCreditsSnap.data();
      const planExpiryDate = data['planExpiryDate']?.toDate?.();
      const creditsExpiryDate = data['creditsExpiryDate']?.toDate?.();
      const planStartDate = data['planStartDate']?.toDate?.();

      const now = new Date();
      const isExpired = planExpiryDate ? planExpiryDate < now : false;

      return {
        userId,
        balance: Number(data['balance']) || 0,
        lastUpdated: data['lastUpdated'],
        totalEarned: Number(data['totalEarned']) || 0,
        totalUsed: Number(data['totalUsed']) || 0,

        activePlanId: data['activePlanId'],
        planName: data['planName'],

        // ✅ ESTA LÍNEA ES LA CLAVE DEL PROBLEMA
        planCredits: Number(data['planCredits']) || 0,

        planStartDate,
        planExpiryDate,
        creditsExpiryDate,

        paymentMethod: data['paymentMethod'],
        previousPlanId: data['previousPlanId'],
        isExpired
      };


    } catch (error) {
      console.error('Error getting user credits:', error);
      return null;
    }
  }

  async getUserTransactionHistory(
    userId: string,
    options: {
      limit?: number;
      type?: CreditTransaction['type'];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<CreditTransaction[]> {
    try {
      const {
        limit: limitValue = 50,
        type,
        startDate,
        endDate
      } = options;

      let q = query(
        collection(this.firestore, this.transactionsColl),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitValue)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snap = await getDocs(q);
      const transactions: CreditTransaction[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data();
        transactions.push({
          id: docSnap.id,
          userId: data['userId'],
          type: data['type'],
          amount: data['amount'],
          description: data['description'],
          reference: data['reference'],
          createdAt: data['createdAt'],
          balanceAfter: data['balanceAfter'],
          expiresAt: data['expiresAt']?.toDate?.(),
          planId: data['planId'],
          paymentMethod: data['paymentMethod']
        });
      });

      return transactions.filter(transaction => {
        const transDate = transaction.createdAt?.toDate?.();
        if (!transDate) return true;

        if (startDate && transDate < startDate) return false;
        if (endDate && transDate > endDate) return false;
        return true;
      });

    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // ==================== EXPIRACIÓN ====================
  private async expireCreditsIfNeeded(userId: string): Promise<void> {
    try {
      const userCredits = await this.getUserCredits(userId);
      if (!userCredits || userCredits.balance <= 0) return;

      const now = new Date();
      let shouldExpire = false;

      if (userCredits.planExpiryDate && userCredits.planExpiryDate < now) {
        shouldExpire = true;
      }

      if (userCredits.creditsExpiryDate && userCredits.creditsExpiryDate < now) {
        shouldExpire = true;
      }

      if (shouldExpire) {
        const userCreditsRef = doc(this.firestore, this.creditsColl, userId);

        await this.recordTransaction({
          userId,
          type: 'expiration',
          amount: -userCredits.balance,
          description: 'Créditos expirados por fin de plan',
          createdAt: serverTimestamp(),
          balanceAfter: 0
        });

        await updateDoc(userCreditsRef, {
          balance: 0,
          lastUpdated: serverTimestamp(),
          isExpired: true
        });
      }

    } catch (error) {
      console.error('Error expiring credits:', error);
    }
  }

  async expireUserCredits(userId: string, reason: string = 'Plan expired'): Promise<void> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) return;

      const currentBalance = Number(userCreditsSnap.data()['balance']) || 0;

      if (currentBalance > 0) {
        await this.recordTransaction({
          userId,
          type: 'expiration',
          amount: -currentBalance,
          description: reason,
          createdAt: serverTimestamp(),
          balanceAfter: 0
        });

        await updateDoc(userCreditsRef, {
          balance: 0,
          lastUpdated: serverTimestamp(),
          isExpired: true,
          creditsExpiryDate: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error force expiring credits:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================
  private calculateExpiryDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    // Ajustar a fin de día para mejor UX
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private async calculateValidBalance(userId: string): Promise<number> {
    try {
      const now = new Date();
      const transactions = await this.getUserTransactionHistory(userId, { limit: 100 });

      let validBalance = 0;

      for (const transaction of transactions) {
        if (transaction.amount > 0) {
          const expiresAt = transaction.expiresAt;
          if (!expiresAt || expiresAt > now) {
            validBalance += transaction.amount;
          }
        } else {
          validBalance += transaction.amount;
        }
      }

      return Math.max(0, validBalance);

    } catch (error) {
      console.error('Error calculating valid balance:', error);
      return 0;
    }
  }

  private async recordTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<void> {
    try {
      const transactionRef = doc(collection(this.firestore, this.transactionsColl));

      const transactionData: any = {
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        reference: transaction.reference || null,
        createdAt: transaction.createdAt,
        balanceAfter: transaction.balanceAfter,
        id: transactionRef.id
      };

      if (transaction.expiresAt) {
        const expiresAtAny = transaction.expiresAt as any;

        if (expiresAtAny instanceof Date) {
          transactionData.expiresAt = Timestamp.fromDate(expiresAtAny);
        } else if (expiresAtAny && typeof expiresAtAny === 'object' && expiresAtAny.toDate) {
          transactionData.expiresAt = expiresAtAny;
        } else {
          try {
            const date = new Date(expiresAtAny);
            if (!isNaN(date.getTime())) {
              transactionData.expiresAt = Timestamp.fromDate(date);
            }
          } catch {
            // Si no se puede convertir, se omite
          }
        }
      }

      if (transaction.planId) {
        transactionData.planId = transaction.planId;
      }

      if (transaction.paymentMethod) {
        transactionData.paymentMethod = transaction.paymentMethod;
      }

      await setDoc(transactionRef, transactionData);

    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS SIMPLES ====================
  async getUserBalance(userId: string): Promise<number> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) {
        return 0;
      }

      return Number(userCreditsSnap.data()['balance']) || 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }

  async validateSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const { availableBalance } = await this.getValidCredits(userId);
    return availableBalance >= requiredAmount;
  }

  async getCreditsSummary(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalUsed: number;
    hasActivePlan: boolean;
    planName?: string;
    planExpiryDate?: Date;
    daysRemaining: number;
  }> {
    const userCredits = await this.getUserCredits(userId);
    const { hasActivePlan, daysRemaining } = await this.getValidCredits(userId);

    return {
      balance: userCredits?.balance || 0,
      totalEarned: userCredits?.totalEarned || 0,
      totalUsed: userCredits?.totalUsed || 0,
      hasActivePlan,
      planName: userCredits?.planName,
      planExpiryDate: userCredits?.planExpiryDate,
      daysRemaining
    };
  }

  // ==================== MÉTODO PÚBLICO PARA VALIDACIÓN ====================
  async canUserPurchase(userId: string, newPlanId?: string): Promise<{
    canPurchase: boolean;
    reason: string;
    currentPlan?: {
      id: string | null;
      name: string | null;
      balance: number;
      expiryDate: Date | null;
      isExpired: boolean;
    }
  }> {
    try {
      const userCredits = await this.getUserCredits(userId);

      if (!userCredits) {
        return {
          canPurchase: true,
          reason: 'Usuario sin plan previo. Puede comprar nuevo plan.',
          currentPlan: {
            id: null,
            name: null,
            balance: 0,
            expiryDate: null,
            isExpired: true
          }
        };
      }

      const now = new Date();
      const isPlanExpired = userCredits.planExpiryDate ? userCredits.planExpiryDate <= now : true;

      const result = this.canUserPurchasePlan(
        userCredits.activePlanId,
        userCredits.balance,
        userCredits.planExpiryDate,
        newPlanId
      );

      return {
        canPurchase: result.allowed,
        reason: result.reason,
        currentPlan: {
          id: userCredits.activePlanId || null,
          name: userCredits.planName || null,
          balance: userCredits.balance,
          expiryDate: userCredits.planExpiryDate || null,
          isExpired: isPlanExpired
        }
      };

    } catch (error) {
      console.error('Error en canUserPurchase:', error);
      return {
        canPurchase: false,
        reason: 'Error al verificar estado del usuario',
        currentPlan: undefined
      };
    }
  }
}
