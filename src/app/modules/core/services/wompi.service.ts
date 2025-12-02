// 📄 core/services/wompi.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlanModel } from '../../shared/models/plan.model';
import {
  WompiTransactionRequest,
  WompiTransactionResponse,
  WompiCardData
} from '../../shared/models/wompi-transaction.model';

@Injectable({ providedIn: 'root' })
export class WompiService {
  private readonly http = inject(HttpClient);
  private readonly config = environment.wompi;

  // =========================
  // MÉTODO PRINCIPAL DE PAGO
  // =========================
  async processPayment(
    plan: PlanModel,
    cardData: WompiCardData,
    userData: { email: string; fullName?: string; phone?: string }
  ): Promise<WompiTransactionResponse> {
    try {
      console.log('🚀 Iniciando proceso de pago completo...');

      // 1️⃣ Tokenizar tarjeta
      const paymentToken = await this.tokenizeCard(cardData);

      // 2️⃣ Crear transacción
      const transaction = await this.createTransaction(
        plan,
        userData.email,
        paymentToken,
        userData
      );

      console.log('🎉 Proceso de pago completado');
      return transaction;

    } catch (error) {
      console.error('💥 Error en proceso de pago completo:', error);
      throw error;
    }
  }

  // =========================
  // TOKENIZAR TARJETA
  // =========================
  async tokenizeCard(cardData: WompiCardData): Promise<string> {
    const tokenData = {
      number: cardData.number.replace(/\s/g, ''),
      cvc: cardData.cvc,
      exp_month: cardData.exp_month.padStart(2, '0'),
      exp_year: cardData.exp_year.slice(-2),
      card_holder: cardData.card_holder
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.config.publicKey}`,
      'Content-Type': 'application/json'
    });

    try {
      const response = await this.http.post<any>(
        `${this.config.baseUrl}/tokens/cards`,
        tokenData,
        { headers, observe: 'response' }
      ).toPromise();

      if (!response?.body?.data?.id) {
        throw new Error('No se recibió token de Wompi en la respuesta');
      }

      return response.body.data.id;

    } catch (error: any) {
      console.error('💥 Error al tokenizar la tarjeta:', error);
      throw new Error('Error al tokenizar la tarjeta - Revisa los logs');
    }
  }

  // =========================
  // CREAR TRANSACCIÓN CON FIRMA BACKEND
  // =========================
  async createTransaction(
    plan: PlanModel,
    userEmail: string,
    paymentToken: string,
    userData?: { fullName?: string; phone?: string }
  ): Promise<WompiTransactionResponse> {

    // Obtener acceptance token
    const acceptanceToken = await this.getAcceptanceToken();

    const transactionData: WompiTransactionRequest = {
      amount_in_cents: Math.round(plan.price * 100),
      currency: this.config.currency,
      customer_email: userEmail,
      payment_method: {
        type: 'CARD',
        token: paymentToken,
        installments: 1
      },
      reference: `PLAN_${plan.id}_${Date.now()}`,
      acceptance_token: acceptanceToken
    };

    if (userData?.fullName && userData?.phone) {
      transactionData.customer_data = {
        phone_number: userData.phone,
        full_name: userData.fullName
      };
    }

    // Obtener firma del backend
    const signature = await this.getSignatureFromBackend(
      transactionData.reference,
      transactionData.amount_in_cents,
      transactionData.currency
    );

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.config.publicKey}`,
      'Content-Type': 'application/json'
    });

    try {
      const response = await this.http.post<any>(
        `${this.config.baseUrl}/transactions`,
        { ...transactionData, signature },
        { headers, observe: 'response' }
      ).toPromise();

      if (!response?.body?.data?.id) {
        throw new Error('No se recibió ID de transacción de Wompi');
      }

      return response.body;

    } catch (error: any) {
      console.error('💥 Error al procesar la transacción:', error);
      throw new Error('Error al procesar el pago');
    }
  }

  // =========================
  // OBTENER FIRMA DEL BACKEND
  // =========================
  private async getSignatureFromBackend(reference: string, amountInCents: number, currency: string): Promise<string> {
    try {
      const backendUrl = 'https://us-central1-tu-hora-fit.cloudfunctions.net/generateIntegritySignature';

      const signatureData = { reference, amountInCents, currency };

      const response: any = await this.http.post(backendUrl, signatureData).toPromise();

      if (!response?.signature) {
        throw new Error('No se recibió firma del backend');
      }

      return response.signature;

    } catch (error: any) {
      console.error('❌ Error obteniendo firma del backend:', error);
      throw new Error('No se pudo generar la firma de seguridad');
    }
  }

  // =========================
  // OBTENER ACCEPTANCE TOKEN
  // =========================
  private async getAcceptanceToken(): Promise<string> {
    try {
      const response: any = await this.http.get(
        `${this.config.baseUrl}/merchants/${this.config.publicKey}`
      ).toPromise();

      return response.data.presigned_acceptance.acceptance_token;

    } catch (error: any) {
      console.error('❌ Error obteniendo acceptance token:', error);
      throw new Error('No se pudo obtener el token de aceptación de Wompi');
    }
  }

  // =========================
  // VERIFICAR ESTADO DE TRANSACCIÓN
  // =========================
  async getTransactionStatus(transactionId: string): Promise<WompiTransactionResponse> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.config.publicKey}` });

    try {
      const response = await this.http.get<WompiTransactionResponse>(
        `${this.config.baseUrl}/transactions/${transactionId}`,
        { headers }
      ).toPromise();

      if (!response) {
        throw new Error('No se recibió respuesta de Wompi');
      }

      return response;

    } catch (error: any) {
      console.error('💥 Error verificando transacción:', error);
      throw error;
    }
  }

  // =========================
  // VALIDAR FIRMA DE WEBHOOK
  // =========================
  validateWebhookSignature(payload: any, signature: string): boolean {
    console.warn('⚠️ Validación de webhook pendiente');
    return true;
  }
}
