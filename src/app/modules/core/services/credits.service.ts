import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
  increment
} from '@angular/fire/firestore';

export interface CreditTransaction {
  id?: string;
  userId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  reference?: string; // ID del pago o reserva
  createdAt: any;
  balanceAfter: number;
}

export interface UserCredits {
  userId: string;
  balance: number;
  lastUpdated: any;
  totalEarned: number;
  totalUsed: number;
}

@Injectable({
  providedIn: 'root'
})
export class CreditsService {
  private firestore = inject(Firestore);

  // Nombres de colecciones
  private readonly creditsColl = 'userCredits';
  private readonly transactionsColl = 'creditTransactions';

  /**
   * Asignar créditos a un usuario después de un pago exitoso
   */
  async assignCreditsFromPayment(
    userId: string,
    paymentId: string,
    planName: string,
    creditsAmount: number
  ): Promise<void> {
    try {
      console.log(`💰 Assigning ${creditsAmount} credits to user ${userId} from payment ${paymentId}`);

      // 1. Actualizar el saldo del usuario
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      const newBalance = userCreditsSnap.exists()
        ? (userCreditsSnap.data()['balance'] || 0) + creditsAmount
        : creditsAmount;

      // 2. Crear o actualizar el documento de créditos del usuario
      await setDoc(userCreditsRef, {
        userId,
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalEarned: userCreditsSnap.exists()
          ? (userCreditsSnap.data()['totalEarned'] || 0) + creditsAmount
          : creditsAmount,
        totalUsed: userCreditsSnap.exists()
          ? (userCreditsSnap.data()['totalUsed'] || 0)
          : 0
      }, { merge: true });

      // 3. Registrar la transacción
      await this.recordTransaction({
        userId,
        type: 'purchase',
        amount: creditsAmount,
        description: `Compra de plan: ${planName}`,
        reference: paymentId,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance
      });

      console.log(`✅ Successfully assigned ${creditsAmount} credits to user ${userId}. New balance: ${newBalance}`);

    } catch (error) {
      console.error('💥 Error assigning credits:', error);
      throw new Error('No se pudieron asignar los créditos');
    }
  }

  /**
   * Obtener el saldo actual de un usuario
   */
  async getUserBalance(userId: string): Promise<number> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) {
        return 0; // Usuario sin créditos registrados
      }

      return userCreditsSnap.data()['balance'] || 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }

  /**
   * Obtener información completa de créditos del usuario
   */
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);
      const userCreditsSnap = await getDoc(userCreditsRef);

      if (!userCreditsSnap.exists()) {
        return null;
      }

      const data = userCreditsSnap.data();
      return {
        userId,
        balance: data['balance'] || 0,
        lastUpdated: data['lastUpdated'],
        totalEarned: data['totalEarned'] || 0,
        totalUsed: data['totalUsed'] || 0
      };
    } catch (error) {
      console.error('Error getting user credits:', error);
      return null;
    }
  }

  /**
   * Usar créditos (para reservas, etc.)
   */
  async useCredits(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<boolean> {
    try {
      const currentBalance = await this.getUserBalance(userId);

      if (currentBalance < amount) {
        throw new Error('Créditos insuficientes');
      }

      const newBalance = currentBalance - amount;
      const userCreditsRef = doc(this.firestore, this.creditsColl, userId);

      // Actualizar saldo
      await updateDoc(userCreditsRef, {
        balance: newBalance,
        lastUpdated: serverTimestamp(),
        totalUsed: increment(amount)
      });

      // Registrar transacción
      await this.recordTransaction({
        userId,
        type: 'usage',
        amount: -amount, // Negativo porque es uso
        description,
        reference,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance
      });

      console.log(`✅ Used ${amount} credits from user ${userId}. New balance: ${newBalance}`);
      return true;

    } catch (error) {
      console.error('Error using credits:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de transacciones de un usuario
   */
  async getUserTransactionHistory(userId: string, limit: number = 10): Promise<CreditTransaction[]> {
    try {
      // En una implementación real, usaríamos una query con orderBy y limit
      // Por ahora simulamos que obtenemos las transacciones
      console.log(`📊 Getting transaction history for user ${userId}`);

      // TODO: Implementar query real a Firestore
      return [];

    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Registrar una transacción de créditos
   */
  private async recordTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<void> {
    try {
      const transactionRef = doc(collection(this.firestore, this.transactionsColl));
      await setDoc(transactionRef, {
        ...transaction,
        id: transactionRef.id
      });
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Validar si un usuario tiene créditos suficientes
   */
  async validateSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= requiredAmount;
  }

  /**
   * Obtener resumen de créditos (para mostrar en UI)
   */
  async getCreditsSummary(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalUsed: number;
  }> {
    const userCredits = await this.getUserCredits(userId);

    return {
      balance: userCredits?.balance || 0,
      totalEarned: userCredits?.totalEarned || 0,
      totalUsed: userCredits?.totalUsed || 0
    };
  }
}
