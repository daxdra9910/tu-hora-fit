import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonIcon, IonItem, IonLabel,
  IonList, IonButtons, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowBack, card, download, shareSocial, calendar, home } from 'ionicons/icons';

import { PaymentsService } from '../../../core/services/payments.service';
import { PlansService } from '../../../core/services/plans.service';
import { PlanModel } from '../../../shared/models/plan.model';
import { PaymentModel } from '../../../shared/models/payment.model';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  templateUrl: './payment-success.page.html',
  styleUrls: ['./payment-success.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonIcon, IonItem, IonLabel,
    IonList, IonButtons, IonText
  ]
})
export class PaymentSuccessPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private plansService = inject(PlansService);
  private utils = inject(UtilsService);

  loading = true;
  payment: PaymentModel | null = null;
  plan: PlanModel | null = null;

  // Datos de prueba - reemplazar con servicio de usuario real
  currentUser = {
    id: 'user_test_123',
    email: 'cliente@ejemplo.com',
    fullName: 'Juan Pérez'
  };

  constructor() {
    addIcons({ checkmarkCircle, arrowBack, card, download, shareSocial, calendar, home });
  }

  async ngOnInit() {
    console.log('🎉 PaymentSuccessPage initialized');

    // Obtener parámetros de la URL
    const paymentId = this.route.snapshot.queryParamMap.get('paymentId');
    const planId = this.route.snapshot.queryParamMap.get('planId');

    console.log('📋 Params:', { paymentId, planId });

    if (paymentId && planId) {
      await this.loadPaymentData(paymentId, planId);
    } else {
      console.error('❌ Missing paymentId or planId in URL');
      this.router.navigate(['/plans']);
    }
  }

  async loadPaymentData(paymentId: string, planId: string) {
    try {
      console.log('🔄 Loading payment and plan data...');

      // Cargar datos del pago
      this.payment = await this.paymentsService.getPayment(paymentId);
      console.log('✅ Payment loaded:', this.payment);

      // Cargar datos del plan
      this.plan = await this.plansService.getPlan(planId);
      console.log('✅ Plan loaded:', this.plan);

      if (!this.payment || !this.plan) {
        throw new Error('No se pudieron cargar los datos del pago');
      }

      // Simular asignación de créditos (reemplazar con servicio real)
      await this.assignCreditsToUser();

    } catch (error) {
      console.error('💥 Error loading payment data:', error);
      await this.presentToast('Error al cargar los datos del pago', 'danger');
      this.router.navigate(['/plans']);
    } finally {
      this.loading = false;
    }
  }

  private async assignCreditsToUser() {
    // TODO: Reemplazar con servicio real de créditos
    console.log(`💰 Assigning ${this.plan?.creditsTotal} credits to user ${this.currentUser.id}`);

    // Simular proceso de asignación
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Credits assigned successfully');

    // Mostrar notificación de éxito
    await this.presentToast(
      `¡Listo! Se han asignado ${this.plan?.creditsTotal} créditos a tu cuenta`,
      'success'
    );
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Formato compacto para fecha completa
  formatDateCompact(timestamp: any): string {
    if (!timestamp) return 'Fecha no disponible';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Método para solo la fecha
  formatDateOnly(timestamp: any): string {
    if (!timestamp) return 'Fecha no disponible';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  // Método para solo la hora
  formatTimeOnly(timestamp: any): string {
    if (!timestamp) return 'Hora no disponible';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Método para nombre del método de pago
  getPaymentMethodName(method: string | undefined): string {
    if (!method) return 'No especificado';

    const methods: { [key: string]: string } = {
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'pse': 'PSE',
      'cash': 'Efectivo',
      'transfer': 'Transferencia Bancaria',
      'nequi': 'Nequi',
      'daviplata': 'Daviplata',
      'card': 'Tarjeta',
      'CARD': 'Tarjeta',
      'PSE': 'PSE',
      'BANK_TRANSFER': 'Transferencia Bancaria'
    };

    return methods[method] || method;
  }

  // Método original que ya tenías
  formatDate(timestamp: any): string {
    if (!timestamp) return 'Fecha no disponible';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  goToPlans() {
    this.router.navigate(['/plans']);
  }

  downloadReceipt() {
    // TODO: Implementar descarga de recibo
    this.presentToast('Funcionalidad de recibo en desarrollo', 'warning');
  }

  shareSuccess() {
    // TODO: Implementar compartir en redes sociales
    this.presentToast('Funcionalidad de compartir en desarrollo', 'warning');
  }

  private async presentToast(message: string, color: string = 'warning') {
    await this.utils.presentToast({
      message,
      duration: 4000,
      color: color as any,
      position: 'bottom'
    });
  }
}