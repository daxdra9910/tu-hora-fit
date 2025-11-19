import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc
} from '@angular/fire/firestore';
import { PaymentCreateDTO, PaymentModel, PaymentUpdateDTO, PaymentStatus } from '../../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly firestore = inject(Firestore);
  private readonly collName = 'payments';

  // Crear pago
  async createPayment(data: PaymentCreateDTO): Promise<string> {
    const ref = doc(collection(this.firestore, this.collName));
    const paymentData = {
      ...data,
      status: 'pending' as PaymentStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, paymentData);
    return ref.id;
  }

  // Obtener pago por ID
  async getPayment(paymentId: string): Promise<PaymentModel | null> {
    const ref = doc(this.firestore, `${this.collName}/${paymentId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...snap.data()
    } as PaymentModel;
  }

  // Actualizar estado del pago
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    wompiData?: {
      wompiTransactionId?: string;
      wompiReference?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    const ref = doc(this.firestore, `${this.collName}/${paymentId}`);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (wompiData?.wompiTransactionId) {
      updateData.wompiTransactionId = wompiData.wompiTransactionId;
    }
    if (wompiData?.wompiReference) {
      updateData.wompiReference = wompiData.wompiReference;
    }
    if (wompiData?.errorMessage) {
      updateData.errorMessage = wompiData.errorMessage;
    }

    await updateDoc(ref, updateData);
  }

  // Obtener pagos por usuario
  async getUserPayments(userId: string): Promise<PaymentModel[]> {
    // Implementar cuando necesites historial de pagos
    console.log('Getting payments for user:', userId);
    return [];
  }
}
