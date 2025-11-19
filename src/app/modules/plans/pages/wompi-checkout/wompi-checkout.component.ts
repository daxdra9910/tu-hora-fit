import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← AGREGAR ESTA IMPORTACIÓN
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol,
  IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { card, lockClosed, calendar, person, alertCircle, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-wompi-checkout',
  standalone: true,
  templateUrl: './wompi-checkout.component.html',
  styleUrls: ['./wompi-checkout.component.scss'],
  imports: [
    CommonModule,
    FormsModule, // ← AGREGAR ESTA LÍNEA (ES LA SOLUCIÓN)
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol,
    IonIcon, IonText
  ]
})
export class WompiCheckoutComponent {
  @Input() amount: number = 0;
  @Input() userEmail: string = '';
  @Input() userFullName: string = '';
  @Input() userPhone: string = '';
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() paymentCancel = new EventEmitter<void>();

  // Datos de la tarjeta
  cardData = {
    number: '',
    cvc: '',
    exp_month: '',
    exp_year: '',
    card_holder: this.userFullName || '' // ← Inicializar con nombre del usuario
  };

  processing = false;
  errors: { [key: string]: string } = {};

  constructor() {
    addIcons({ card, lockClosed, calendar, person, alertCircle, checkmarkCircle });
  }

  // ← AGREGAR: Inicializar con datos del usuario
  ngOnInit() {
    this.cardData.card_holder = this.userFullName;
  }

  async processPayment() {
    if (!this.validateForm()) return;

    this.processing = true;
    this.errors = {};

    try {
      // Simulación de tokenización con Wompi
      const token = await this.tokenizeCardWithWompi();

      // Simulación de creación de transacción
      const transaction = await this.createWompiTransaction(token);

      // Emitir éxito
      this.paymentSuccess.emit({
        token,
        transaction,
        cardData: { ...this.cardData }
      });

    } catch (error: any) {
      this.paymentError.emit(error.message || 'Error en el proceso de pago');
    } finally {
      this.processing = false;
    }
  }

  private async tokenizeCardWithWompi(): Promise<string> {
    // Simular llamada a API de Wompi para tokenización
    await new Promise(resolve => setTimeout(resolve, 2000));

    // En producción, esto haría una llamada real a Wompi
    return `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createWompiTransaction(token: string): Promise<any> {
    // Simular creación de transacción en Wompi
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      id: `wompi_txn_${Date.now()}`,
      status: 'APPROVED',
      reference: `REF_${Date.now()}`,
      amount: this.amount
    };
  }

  private validateForm(): boolean {
    this.errors = {};

    // Validar número de tarjeta (16 dígitos)
    const cleanNumber = this.cardData.number.replace(/\s/g, '');
    if (!cleanNumber || !/^\d{16}$/.test(cleanNumber)) {
      this.errors['number'] = 'Número de tarjeta inválido (16 dígitos requeridos)';
    }

    // Validar CVC (3-4 dígitos)
    if (!this.cardData.cvc || !/^\d{3,4}$/.test(this.cardData.cvc)) {
      this.errors['cvc'] = 'CVC inválido (3-4 dígitos requeridos)';
    }

    // Validar fecha de expiración
    if (!this.cardData.exp_month || !this.cardData.exp_year) {
      this.errors['expiry'] = 'Fecha de expiración requerida';
    } else if (!/^\d{2}$/.test(this.cardData.exp_month) || !/^\d{2}$/.test(this.cardData.exp_year)) {
      this.errors['expiry'] = 'Formato de fecha inválido (MM/AA)';
    }

    // Validar nombre del titular
    if (!this.cardData.card_holder || this.cardData.card_holder.trim().length < 3) {
      this.errors['card_holder'] = 'Nombre del titular requerido (mínimo 3 caracteres)';
    }

    return Object.keys(this.errors).length === 0;
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      this.cardData.number = parts.join(' ');
    } else {
      this.cardData.number = value;
    }
  }

  // ← AGREGAR: Formatear mes de expiración
  formatExpMonth(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    this.cardData.exp_month = value;
  }

  // ← AGREGAR: Formatear año de expiración
  formatExpYear(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    this.cardData.exp_year = value;
  }

  // ← AGREGAR: Formatear CVC
  formatCvc(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    this.cardData.cvc = value;
  }

  cancelPayment() {
    this.paymentCancel.emit();
  }
}
