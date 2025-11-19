import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlanModel } from '../../shared/models/plan.model';
import {
  WompiTransactionRequest,
  WompiTransactionResponse,
  WompiTokenResponse,
  WompiCardData
} from '../../shared/models/wompi-transaction.model';

@Injectable({ providedIn: 'root' })
export class WompiService {
  private readonly http = inject(HttpClient);
  private readonly config = environment.wompi;

  // Tokenizar tarjeta
  async tokenizeCard(cardData: WompiCardData): Promise<string> {
    const tokenData = {
      number: cardData.number,
      cvc: cardData.cvc,
      exp_month: cardData.exp_month,
      exp_year: cardData.exp_year,
      card_holder: cardData.card_holder
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.config.publicKey}`,
      'Content-Type': 'application/json'
    });

    try {
      const response = await this.http.post<WompiTokenResponse>(
        `${this.config.baseUrl}/tokens/cards`,
        tokenData,
        { headers }
      ).toPromise();

      return response?.data.id || '';
    } catch (error) {
      console.error('Error tokenizing card:', error);
      throw new Error('No se pudo tokenizar la tarjeta');
    }
  }

  // Crear transacción en Wompi
  async createTransaction(
    plan: PlanModel,
    userEmail: string,
    paymentToken: string,
    userData?: { fullName?: string; phone?: string }
  ): Promise<WompiTransactionResponse> {

    const transactionData: WompiTransactionRequest = {
      amount_in_cents: Math.round(plan.price * 100), // Asegurar número entero
      currency: this.config.currency,
      customer_email: userEmail,
      payment_method: {
        type: 'CARD',
        token: paymentToken,
        installments: 1
      },
      reference: `PLAN_${plan.id}_${Date.now()}`,
    };

    // Agregar datos del cliente si están disponibles
    if (userData?.fullName && userData?.phone) {
      transactionData.customer_data = {
        phone_number: userData.phone,
        full_name: userData.fullName
      };
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.config.privateKey}`,
      'Content-Type': 'application/json'
    });

    try {
      const response = await this.http.post<WompiTransactionResponse>(
        `${this.config.baseUrl}/transactions`,
        transactionData,
        { headers }
      ).toPromise();

      if (!response) {
        throw new Error('No response from Wompi');
      }

      return response;
    } catch (error: any) {
      console.error('Error creating Wompi transaction:', error);
      throw new Error(error?.message || 'Error al crear transacción en Wompi');
    }
  }

  // Verificar estado de transacción
  async getTransactionStatus(transactionId: string): Promise<WompiTransactionResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.config.publicKey}`
    });

    try {
      const response = await this.http.get<WompiTransactionResponse>(
        `${this.config.baseUrl}/transactions/${transactionId}`,
        { headers }
      ).toPromise();

      if (!response) {
        throw new Error('No response from Wompi');
      }

      return response;
    } catch (error: any) {
      console.error('Error getting transaction status:', error);
      throw new Error(error?.message || 'Error al verificar estado de transacción');
    }
  }

  // Validar signature del webhook (seguridad)
  validateWebhookSignature(payload: any, signature: string): boolean {
    // Implementar validación de firma para webhooks
    // Por ahora retornamos true para desarrollo
    console.warn('Webhook signature validation not implemented');
    return true;
  }
}
