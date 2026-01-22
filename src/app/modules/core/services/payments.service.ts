import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit as firestoreLimit
} from '@angular/fire/firestore';
import {
  PaymentCreateDTO,
  PaymentModel,
  PaymentUpdateDTO,
  PaymentStatus,
  CashPaymentCreateDTO
} from '../../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly firestore = inject(Firestore);
  private readonly collName = 'payments';

  // ==================== CREACIÓN DE PAGOS ====================

  async createPayment(data: PaymentCreateDTO): Promise<string> {
    const ref = doc(collection(this.firestore, this.collName));

    const paymentData = {
      ...data,
      status: 'pending' as PaymentStatus,
      paymentMethod: 'wompi' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, paymentData);
    console.log(`💰 Payment created: ${ref.id} for user ${data.userId}`);
    return ref.id;
  }

  async createCashPayment(data: CashPaymentCreateDTO): Promise<string> {
    const ref = doc(collection(this.firestore, this.collName));

    const planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30);

    const paymentData = {
      planId: data.planId,
      planName: data.planName,
      amount: data.amount,
      credits: data.credits,
      userId: data.userId,
      userEmail: data.userEmail,
      userFullName: data.userFullName,
      status: 'approved' as PaymentStatus,
      paymentMethod: 'cash_admin' as const,
      activatedBy: data.adminId,
      activatedAt: serverTimestamp(),
      cashReceiptNumber: data.cashReceiptNumber,
      notes: data.notes,
      planStartDate: serverTimestamp(),
      planExpiryDate: planExpiryDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, paymentData);
    console.log(`💵 Cash payment created: ${ref.id} by admin ${data.adminId}`);
    return ref.id;
  }

  async createPlanChangePayment(data: {
    userId: string;
    userEmail: string;
    userFullName?: string;
    currentPlanId: string;
    newPlanId: string;
    newPlanName: string;
    amount: number;
    credits: number;
    proratedAmount: number;
    remainingCredits: number;
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet';
    adminId?: string;
    reason?: string;
  }): Promise<string> {
    const ref = doc(collection(this.firestore, this.collName));

    const planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30);

    const paymentData = {
      planId: data.newPlanId,
      planName: data.newPlanName,
      amount: data.amount,
      credits: data.credits,
      userId: data.userId,
      userEmail: data.userEmail,
      userFullName: data.userFullName,
      status: data.amount > 0 ? 'pending' : 'approved' as PaymentStatus,
      paymentMethod: data.paymentMethod,
      isPlanChange: true,
      previousPlanId: data.currentPlanId,
      proratedAmount: data.proratedAmount,
      remainingCreditsFromOldPlan: data.remainingCredits,
      ...(data.adminId && {
        activatedBy: data.adminId,
        activatedAt: data.amount === 0 ? serverTimestamp() : undefined,
      }),
      planStartDate: serverTimestamp(),
      planExpiryDate: planExpiryDate,
      notes: data.reason ? `Cambio de plan: ${data.reason}` : 'Cambio de plan',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, paymentData);
    console.log(`🔄 Plan change payment created: ${ref.id} for user ${data.userId}`);
    return ref.id;
  }

  // ==================== ACTUALIZACIÓN DE PAGOS ====================

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    updateData?: {
      wompiTransactionId?: string;
      wompiReference?: string;
      errorMessage?: string;
      paymentMethod?: 'wompi' | 'cash_admin' | 'wallet';
      activatedBy?: string;
      activatedAt?: any;
      cashReceiptNumber?: string;
      notes?: string;
      planExpiryDate?: Date;
      invoiceNumber?: string;
    }
  ): Promise<void> {
    const ref = doc(this.firestore, `${this.collName}/${paymentId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const updatePayload: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (updateData?.wompiTransactionId) updatePayload.wompiTransactionId = updateData.wompiTransactionId;
    if (updateData?.wompiReference) updatePayload.wompiReference = updateData.wompiReference;
    if (updateData?.errorMessage) updatePayload.errorMessage = updateData.errorMessage;
    if (updateData?.paymentMethod) updatePayload.paymentMethod = updateData.paymentMethod;
    if (updateData?.activatedBy) {
      updatePayload.activatedBy = updateData.activatedBy;
      updatePayload.activatedAt = updateData.activatedAt || serverTimestamp();
    }
    if (updateData?.cashReceiptNumber) updatePayload.cashReceiptNumber = updateData.cashReceiptNumber;
    if (updateData?.notes) updatePayload.notes = updateData.notes;
    if (updateData?.planExpiryDate) updatePayload.planExpiryDate = updateData.planExpiryDate;
    if (updateData?.invoiceNumber) updatePayload.invoiceNumber = updateData.invoiceNumber;

    if (status === 'approved' && !updatePayload.activatedAt && !snap.data()['activatedAt']) {
      updatePayload.activatedAt = serverTimestamp();
      if (!updatePayload.planExpiryDate && !snap.data()['planExpiryDate']) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        updatePayload.planExpiryDate = expiryDate;
      }
    }

    await updateDoc(ref, updatePayload);
    console.log(`📝 Payment ${paymentId} updated to status: ${status}`);
  }

  async updatePayment(paymentId: string, data: PaymentUpdateDTO): Promise<void> {
    const ref = doc(this.firestore, `${this.collName}/${paymentId}`);
    const updatePayload: any = { ...data, updatedAt: serverTimestamp() };
    await updateDoc(ref, updatePayload);
    console.log(`📝 Payment ${paymentId} updated`);
  }

  // ==================== CONSULTAS DE PAGOS ====================

  async getPayment(paymentId: string): Promise<PaymentModel | null> {
    const ref = doc(this.firestore, `${this.collName}/${paymentId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();
    return this.mapPaymentDocument(snap.id, data);
  }

  async getUserPayments(
    userId: string,
    options: {
      limit?: number;
      status?: PaymentStatus;
      paymentMethod?: 'wompi' | 'cash_admin' | 'wallet';
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<PaymentModel[]> {
    const {
      limit: itemsLimit = 50,
      status,
      paymentMethod,
      startDate,
      endDate
    } = options;

    try {
      let q = query(
        collection(this.firestore, this.collName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(itemsLimit)
      );

      if (status) q = query(q, where('status', '==', status));
      if (paymentMethod) q = query(q, where('paymentMethod', '==', paymentMethod));

      const snap = await getDocs(q);
      const payments: PaymentModel[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data();
        const payment = this.mapPaymentDocument(docSnap.id, data);

        if (startDate || endDate) {
          const paymentDate = this.extractDateFromField(payment.createdAt);
          if (!paymentDate) return;

          if (startDate && paymentDate < startDate) return;
          if (endDate && paymentDate > endDate) return;
        }

        payments.push(payment);
      });

      console.log(`📊 Found ${payments.length} payments for user ${userId}`);
      return payments;

    } catch (error) {
      console.error('Error getting user payments:', error);
      return [];
    }
  }

  async getPlanPayments(planId: string, itemsLimit: number = 100): Promise<PaymentModel[]> {
    try {
      const q = query(
        collection(this.firestore, this.collName),
        where('planId', '==', planId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(itemsLimit)
      );

      const snap = await getDocs(q);
      const payments = snap.docs.map(doc => this.mapPaymentDocument(doc.id, doc.data()));

      console.log(`📊 Found ${payments.length} payments for plan ${planId}`);
      return payments;

    } catch (error) {
      console.error('Error getting plan payments:', error);
      return [];
    }
  }

  async getPaymentsByMethod(
    paymentMethod: 'wompi' | 'cash_admin' | 'wallet',
    startDate?: Date,
    endDate?: Date,
    itemsLimit: number = 100
  ): Promise<PaymentModel[]> {
    try {
      let q = query(
        collection(this.firestore, this.collName),
        where('paymentMethod', '==', paymentMethod),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(itemsLimit)
      );

      const snap = await getDocs(q);
      const payments = snap.docs
        .map(doc => this.mapPaymentDocument(doc.id, doc.data()))
        .filter(payment => {
          if (!startDate && !endDate) return true;

          const paymentDate = this.extractDateFromField(payment.createdAt);
          if (!paymentDate) return false;

          if (startDate && paymentDate < startDate) return false;
          if (endDate && paymentDate > endDate) return false;
          return true;
        });

      console.log(`📊 Found ${payments.length} payments by method ${paymentMethod}`);
      return payments;

    } catch (error) {
      console.error('Error getting payments by method:', error);
      return [];
    }
  }

  async getPaymentStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRevenue: number;
    wompiRevenue: number;
    cashRevenue: number;
    walletRevenue: number;
    totalPayments: number;
    approvedPayments: number;
    pendingPayments: number;
    averageTicket: number;
  }> {
    try {
      let q = query(
        collection(this.firestore, this.collName),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);

      let totalRevenue = 0;
      let wompiRevenue = 0;
      let cashRevenue = 0;
      let walletRevenue = 0;
      let totalPayments = 0;
      let approvedPayments = 0;
      let pendingPayments = 0;

      snap.forEach(docSnap => {
        const data = docSnap.data();
        const paymentDate = this.extractDateFromField(data['createdAt']);

        if (startDate && paymentDate && paymentDate < startDate) return;
        if (endDate && paymentDate && paymentDate > endDate) return;

        const amount = +(data['amount'] || 0);
        const status = data['status'] || 'pending';
        const method = data['paymentMethod'] || 'wompi';

        totalPayments++;

        if (status === 'approved') {
          approvedPayments++;
          totalRevenue += amount;

          switch (method) {
            case 'wompi': wompiRevenue += amount; break;
            case 'cash_admin': cashRevenue += amount; break;
            case 'wallet': walletRevenue += amount; break;
          }
        } else if (status === 'pending') {
          pendingPayments++;
        }
      });

      const averageTicket = approvedPayments > 0 ? totalRevenue / approvedPayments : 0;

      return {
        totalRevenue,
        wompiRevenue,
        cashRevenue,
        walletRevenue,
        totalPayments,
        approvedPayments,
        pendingPayments,
        averageTicket
      };

    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalRevenue: 0,
        wompiRevenue: 0,
        cashRevenue: 0,
        walletRevenue: 0,
        totalPayments: 0,
        approvedPayments: 0,
        pendingPayments: 0,
        averageTicket: 0
      };
    }
  }

  // ==================== UTILIDADES PRIVADAS ====================

  /**
   * Extraer Date de cualquier campo (Timestamp, Date, string, etc.)
   */
  private extractDateFromField(field: any): Date | undefined {
    if (!field) return undefined;

    // Si es Timestamp de Firestore (con método toDate)
    if (field && typeof field === 'object' && 'toDate' in field && typeof field.toDate === 'function') {
      return field.toDate();
    }

    // Si ya es Timestamp de AngularFire
    if (field instanceof Timestamp) {
      return field.toDate();
    }

    // Si es Date
    if (field instanceof Date) {
      return field;
    }

    // Si es string ISO
    if (typeof field === 'string') {
      try {
        const date = new Date(field);
        return !isNaN(date.getTime()) ? date : undefined;
      } catch {
        return undefined;
      }
    }

    // Si es número (timestamp en milisegundos)
    if (typeof field === 'number') {
      const date = new Date(field);
      return !isNaN(date.getTime()) ? date : undefined;
    }

    return undefined;
  }

  /**
   * Mapear documento Firestore a PaymentModel
   */
  private mapPaymentDocument(id: string, data: any): PaymentModel {
    // Función para procesar fechas de forma segura
    const processDate = (field: any): any => {
      if (!field) return undefined;

      // Si ya es Timestamp
      if (field instanceof Timestamp) {
        return field;
      }

      // Si es Timestamp de Firestore (con método toDate)
      if (field && typeof field === 'object' && 'toDate' in field && typeof field.toDate === 'function') {
        return field;
      }

      // Si es Date
      if (field instanceof Date) {
        return Timestamp.fromDate(field);
      }

      // Si es string ISO
      if (typeof field === 'string') {
        try {
          const date = new Date(field);
          return !isNaN(date.getTime()) ? Timestamp.fromDate(date) : undefined;
        } catch {
          return undefined;
        }
      }

      return undefined;
    };

    // Extraer valores seguros
    const extractNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const extractString = (value: any): string | undefined => {
      return value !== null && value !== undefined ? String(value) : undefined;
    };

    return {
      id,
      planId: extractString(data['planId']),
      userId: extractString(data['userId']),
      userEmail: extractString(data['userEmail']),
      userFullName: extractString(data['userFullName']),
      userPhone: extractString(data['userPhone']),
      amount: extractNumber(data['amount']),
      credits: extractNumber(data['credits']),
      status: (data['status'] as PaymentStatus) || 'pending',
      paymentMethod: data['paymentMethod'] || 'wompi',
      activatedBy: extractString(data['activatedBy']),
      activatedAt: processDate(data['activatedAt']),
      cashReceiptNumber: extractString(data['cashReceiptNumber']),
      notes: extractString(data['notes']),
      isPlanChange: Boolean(data['isPlanChange']) || false,
      previousPlanId: extractString(data['previousPlanId']),
      proratedAmount: extractNumber(data['proratedAmount']),
      remainingCreditsFromOldPlan: extractNumber(data['remainingCreditsFromOldPlan']),
      planStartDate: processDate(data['planStartDate']),
      planExpiryDate: processDate(data['planExpiryDate']),
      wompiTransactionId: extractString(data['wompiTransactionId']),
      wompiReference: extractString(data['wompiReference']),
      errorMessage: extractString(data['errorMessage']),
      invoiceNumber: extractString(data['invoiceNumber']),
      taxAmount: extractNumber(data['taxAmount']),
      createdAt: processDate(data['createdAt']) || Timestamp.now(),
      updatedAt: processDate(data['updatedAt']) || Timestamp.now(),
      createdBy: extractString(data['createdBy']),
      updatedBy: extractString(data['updatedBy']),
    } as PaymentModel;
  }

  /**
   * Generar número de factura único
   */
  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Verificar si un usuario tiene un pago pendiente para un plan
   */
  async hasPendingPayment(userId: string, planId: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collName),
        where('userId', '==', userId),
        where('planId', '==', planId),
        where('status', 'in', ['pending', 'processing']),
        firestoreLimit(1)
      );

      const snap = await getDocs(q);
      return !snap.empty;

    } catch (error) {
      console.error('Error checking pending payment:', error);
      return false;
    }
  }
}
