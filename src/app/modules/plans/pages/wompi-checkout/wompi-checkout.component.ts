import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol,
  IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { card, lockClosed, calendar, person, alertCircle, checkmarkCircle } from 'ionicons/icons';

import { WompiService } from '../../../core/services/wompi.service';
import { PlanModel } from '../../../shared/models/plan.model';

@Component({
  selector: 'app-wompi-checkout',
  standalone: true,
  templateUrl: './wompi-checkout.component.html',
  styleUrls: ['./wompi-checkout.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol,
    IonIcon, IonText
  ]
})
export class WompiCheckoutComponent {
  private wompiService = inject(WompiService);

  @Input() amount: number = 0;
  @Input() userEmail: string = '';
  @Input() userFullName: string = '';
  @Input() userPhone: string = '';
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() paymentCancel = new EventEmitter<void>();

  cardData = {
    number: '',
    cvc: '',
    exp_month: '',
    exp_year: '',
    card_holder: this.userFullName || ''
  };

  processing = false;
  errors: { [key: string]: string } = {};

  constructor() {
    addIcons({ card, lockClosed, calendar, person, alertCircle, checkmarkCircle });
  }

  ngOnInit() {
    this.cardData.card_holder = this.userFullName;
  }

  async processPayment() {
    if (!this.validateForm()) return;

    this.processing = true;
    this.errors = {};

    try {
      console.log('🔄 Procesando pago REAL con Wompi...');

      // 1. Preparar datos para Wompi REAL
      const cardData = {
        number: this.cardData.number.replace(/\s/g, ''),
        cvc: this.cardData.cvc,
        exp_month: this.cardData.exp_month.padStart(2, '0'),
        exp_year: '20' + this.cardData.exp_year,
        card_holder: this.cardData.card_holder
      };

      // 2. Crear plan temporal COMPLETO
      const plan: PlanModel = {
        id: `custom_${Date.now()}`,
        name: `Compra - $${this.amount}`,
        price: this.amount,
        creditsTotal: Math.floor(this.amount / 1000),
        description: 'Compra de créditos',
        state: 'active' as any,
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. LLAMADA REAL A WOMPI
      const transaction = await this.wompiService.processPayment(
        plan,
        cardData,
        {
          email: this.userEmail,
          fullName: this.userFullName,
          phone: this.userPhone || '573001234567'
        }
      );

      console.log('✅ Respuesta INICIAL de Wompi:', transaction.data);

      // ✅✅✅ CORRECCIÓN: VERIFICAR ESTADO FINAL
      const transactionStatus = transaction.data.status;

      if (transactionStatus === 'PENDING') {
        console.log('⏳ Transacción en proceso, verificando estado final...');

        // Esperar y verificar el estado final
        const finalStatus = await this.checkFinalTransactionStatus(transaction.data.id);
        console.log('🎯 Estado FINAL de la transacción:', finalStatus);

        await this.handleFinalTransactionStatus(finalStatus, transaction.data);
      }
      else {
        // Manejar otros estados inmediatos
        await this.handleFinalTransactionStatus(transactionStatus, transaction.data);
      }

    } catch (error: any) {
      console.error('💥 Error en pago REAL:', error);
      const errorMessage = this.getUserFriendlyError(error);
      this.paymentError.emit(errorMessage);
    } finally {
      this.processing = false;
    }
  }

  // ✅ NUEVO MÉTODO: Verificar estado final de la transacción
  private async checkFinalTransactionStatus(transactionId: string): Promise<string> {
    return new Promise((resolve) => {
      console.log('🔍 Verificando estado final de transacción:', transactionId);

      // Intentar verificar varias veces (polling)
      let attempts = 0;
      const maxAttempts = 8; // Máximo 8 intentos
      const checkInterval = 2000; // Cada 2 segundos

      const checkStatus = async () => {
        attempts++;
        console.log(`🔄 Intento ${attempts} de verificación...`);

        try {
          const statusResponse = await this.wompiService.getTransactionStatus(transactionId);
          const currentStatus = statusResponse.data.status;

          console.log(`📊 Estado actual (intento ${attempts}):`, currentStatus);

          // Si el estado ya no es PENDING o llegamos al máximo de intentos
          if (currentStatus !== 'PENDING' || attempts >= maxAttempts) {
            console.log(`🏁 Estado final obtenido: ${currentStatus} (después de ${attempts} intentos)`);
            resolve(currentStatus);
          } else {
            console.log('⏳ Todavía PENDING, verificando nuevamente...');
            setTimeout(checkStatus, checkInterval);
          }
        } catch (error) {
          console.error('Error verificando estado:', error);
          // En caso de error, asumimos que falló después de varios intentos
          if (attempts >= maxAttempts) {
            resolve('ERROR');
          } else {
            setTimeout(checkStatus, checkInterval);
          }
        }
      };

      // Iniciar la verificación
      setTimeout(checkStatus, checkInterval);
    });
  }

  // ✅ NUEVO MÉTODO: Manejar el estado final de la transacción
  private async handleFinalTransactionStatus(
    finalStatus: string,
    transactionData: any
  ): Promise<void> {

    if (finalStatus === 'APPROVED') {
      // EMITIR ÉXITO SOLO SI ESTÁ APROBADO
      console.log('🎉 Pago APROBADO - emitiendo éxito');
      this.paymentSuccess.emit({
        transaction: transactionData,
        cardData: { ...this.cardData },
        wompiId: transactionData.id,
        reference: transactionData.reference,
        status: finalStatus
      });
    }
    else if (finalStatus === 'DECLINED') {
      // EMITIR ERROR SI ESTÁ DECLINADO
      console.log('❌ Pago DECLINADO - emitiendo error');
      const errorMessage = 'Transacción declinada por el banco. Por favor usa otra tarjeta.';
      this.paymentError.emit(errorMessage);
    }
    else if (finalStatus === 'VOIDED') {
      // EMITIR ERROR SI FUE ANULADA
      console.log('❌ Pago ANULADO - emitiendo error');
      const errorMessage = 'Transacción anulada. Por favor intenta nuevamente.';
      this.paymentError.emit(errorMessage);
    }
    else if (finalStatus === 'ERROR') {
      // EMITIR ERROR GENERAL
      console.log('❌ ERROR en pago - emitiendo error');
      const errorMessage = 'Error en el procesamiento del pago. Intenta nuevamente.';
      this.paymentError.emit(errorMessage);
    }
    else {
      // EMITIR ERROR PARA CUALQUIER OTRO ESTADO (incluyendo PENDING timeout)
      console.log('⚠️  Estado desconocido o timeout - emitiendo error');
      const errorMessage = `No se pudo confirmar el estado del pago. Estado: ${finalStatus}`;
      this.paymentError.emit(errorMessage);
    }
  }

  private getUserFriendlyError(error: any): string {
    const errorMsg = error.message || 'Error procesando el pago';

    // Buscar el estado en la respuesta de error
    if (error.response?.data?.status === 'DECLINED') {
      return 'Transacción rechazada por el banco. Verifica con tu entidad financiera.';
    }

    if (errorMsg.includes('tokenize') || errorMsg.includes('tarjeta')) {
      return 'Error al procesar la tarjeta. Verifica los datos.';
    }
    if (errorMsg.includes('DECLINED') || errorMsg.includes('rechazada')) {
      return 'Transacción rechazada. Verifica con tu banco.';
    }
    if (errorMsg.includes('acceptance')) {
      return 'Error de configuración. Intenta más tarde.';
    }

    return errorMsg;
  }

  private validateForm(): boolean {
    this.errors = {};

    const cleanNumber = this.cardData.number.replace(/\s/g, '');
    if (!cleanNumber || !/^\d{16}$/.test(cleanNumber)) {
      this.errors['number'] = 'Número de tarjeta inválido (16 dígitos)';
    }

    if (!this.cardData.cvc || !/^\d{3,4}$/.test(this.cardData.cvc)) {
      this.errors['cvc'] = 'CVC inválido (3-4 dígitos)';
    }

    if (!this.cardData.exp_month || !this.cardData.exp_year) {
      this.errors['expiry'] = 'Fecha de expiración requerida';
    } else if (!this.isValidExpiry()) {
      this.errors['expiry'] = 'Fecha inválida o vencida';
    }

    if (!this.cardData.card_holder || this.cardData.card_holder.trim().length < 3) {
      this.errors['card_holder'] = 'Nombre requerido (mínimo 3 caracteres)';
    }

    return Object.keys(this.errors).length === 0;
  }

  private isValidExpiry(): boolean {
    if (!this.cardData.exp_month || !this.cardData.exp_year) return false;

    const month = parseInt(this.cardData.exp_month);
    const year = parseInt('20' + this.cardData.exp_year);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return year > currentYear || (year === currentYear && month >= currentMonth);
  }

  // Métodos de formateo (mantener igual)
  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    this.cardData.number = parts.join(' ') || value;
  }

  formatExpMonth(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.substring(0, 2);
    if (value && parseInt(value) > 12) value = '12';
    this.cardData.exp_month = value;
  }

  formatExpYear(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.substring(0, 2);
    this.cardData.exp_year = value;
  }

  formatCvc(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    this.cardData.cvc = value;
  }

  cancelPayment() {
    this.paymentCancel.emit();
  }
}