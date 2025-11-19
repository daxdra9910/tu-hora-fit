import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonIcon, IonItem, IonLabel,
  IonList, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { card, checkmarkCircle, arrowBack, lockClosed, alertCircle } from 'ionicons/icons';

import { PlansService } from '../../../core/services/plans.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { WompiService } from '../../../core/services/wompi.service';
import { PlanModel } from '../../../shared/models/plan.model';
import { UtilsService } from '../../../shared/services/utils.service';
import { WompiCheckoutComponent } from '../wompi-checkout/wompi-checkout.component'; // ← RUTA CORREGIDA

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  imports: [
    CommonModule,
    WompiCheckoutComponent,  // ← COMPONENTE IMPORTADO CORRECTAMENTE
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonIcon, IonItem, IonLabel,
    IonList, IonButtons
  ]
})
export class PaymentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plansService = inject(PlansService);
  private paymentsService = inject(PaymentsService);
  private wompiService = inject(WompiService);
  private utils = inject(UtilsService);

  planId: string = '';
  plan: PlanModel | null = null;
  loading = true;
  processing = false;
  showWompiCheckout = false;
  currentPaymentId: string = '';

  // Datos de prueba - reemplazar con servicio de usuario real
  currentUser = {
    id: 'user_test_123',
    email: 'cliente@ejemplo.com',
    fullName: 'Juan Pérez',
    phone: '573001234567'
  };

  constructor() {
    addIcons({ card, checkmarkCircle, arrowBack, lockClosed, alertCircle });
  }

  async ngOnInit() {
    console.log('🚀 PaymentPage initialized');
    this.planId = this.route.snapshot.paramMap.get('id') || '';
    console.log('📋 Plan ID from URL:', this.planId);
    await this.loadPlan();
  }

  async loadPlan() {
    console.log('🔄 Starting loadPlan');
    this.loading = true;

    if (!this.planId) {
      console.log('❌ No plan ID');
      await this.presentToast('ID de plan no válido', 'danger');
      this.router.navigate(['/plans']);
      return;
    }

    try {
      console.log('🔍 Calling plansService.getPlan with ID:', this.planId);
      this.plan = await this.plansService.getPlan(this.planId);
      console.log('✅ Plan loaded:', this.plan);

      if (!this.plan) {
        console.log('❌ Plan not found in Firestore');
        await this.presentToast('Plan no encontrado', 'danger');
        this.router.navigate(['/plans']);
        return;
      }

      console.log('🎯 Plan details:', {
        name: this.plan.name,
        price: this.plan.price,
        credits: this.plan.creditsTotal,
        state: this.plan.state
      });

    } catch (error) {
      console.error('💥 Error loading plan:', error);
      await this.presentToast('Error al cargar el plan', 'danger');
      this.router.navigate(['/plans']);
    } finally {
      console.log('🏁 loadPlan completed, setting loading to false');
      this.loading = false;
    }
  }

  async processPayment() {
    if (!this.plan) return;

    this.processing = true;
    try {
      // 1. Crear registro de pago en Firestore
      this.currentPaymentId = await this.paymentsService.createPayment({
        planId: this.plan.id,
        planName: this.plan.name,
        amount: this.plan.price,
        credits: this.plan.creditsTotal,
        userId: this.currentUser.id,
        userEmail: this.currentUser.email,
        userFullName: this.currentUser.fullName,
        userPhone: this.currentUser.phone
      });

      console.log('💰 Payment created with ID:', this.currentPaymentId);

      // 2. Mostrar checkout de Wompi (reemplazar simulación)
      this.showWompiCheckout = true;

    } catch (error: any) {
      console.error('Payment process error:', error);
      await this.presentToast(
        error?.message || 'Error en el proceso de pago',
        'danger'
      );
    } finally {
      this.processing = false;
    }
  }

  // Manejar éxito del pago con Wompi
  async onWompiPaymentSuccess(event: any) {
    console.log('✅ Wompi payment success:', event);

    try {
      // Actualizar estado del pago a aprobado
      await this.paymentsService.updatePaymentStatus(this.currentPaymentId, 'approved', {
        wompiTransactionId: event.transaction?.id || `wompi_txn_${Date.now()}`,
        wompiReference: event.transaction?.reference || `REF_${this.plan?.id}_${Date.now()}`
      });

      await this.presentToast('¡Pago exitoso! Redirigiendo...', 'success');

      // Redirigir a la página de éxito con parámetros
      this.router.navigate(['/plans/success'], {
        queryParams: {
          paymentId: this.currentPaymentId,
          planId: this.plan?.id
        }
      });

    } catch (error) {
      console.error('Error updating payment status:', error);
      await this.presentToast('Error al actualizar el estado del pago', 'danger');
    }
  }

  // Manejar error del pago con Wompi
  async onWompiPaymentError(error: string) {
    console.error('❌ Wompi payment error:', error);

    try {
      // Actualizar estado del pago a rechazado
      await this.paymentsService.updatePaymentStatus(this.currentPaymentId, 'rejected', {
        errorMessage: error
      });

      await this.presentToast(error, 'danger');

    } catch (updateError) {
      console.error('Error updating payment status on error:', updateError);
      await this.presentToast('Error en el proceso de pago', 'danger');
    } finally {
      this.showWompiCheckout = false;
    }
  }

  // Manejar cancelación del pago
  async onWompiPaymentCancel() {
    console.log('❌ Wompi payment cancelled by user');

    try {
      // Actualizar estado del pago a cancelado
      await this.paymentsService.updatePaymentStatus(this.currentPaymentId, 'cancelled', {
        errorMessage: 'Pago cancelado por el usuario'
      });

      await this.presentToast('Pago cancelado', 'warning');

    } catch (error) {
      console.error('Error updating payment status on cancel:', error);
    } finally {
      this.showWompiCheckout = false;
    }
  }

  // Volver al resumen del plan desde el checkout
  backToPlanSummary() {
    this.showWompiCheckout = false;
    this.currentPaymentId = '';
  }

  // MÉTODO ORIGINAL (mantenido para compatibilidad)
  private async processWompiPayment(paymentId: string) {
    if (!this.plan) return;

    try {
      // TODO: Integración real con Wompi
      // Por ahora simulamos el proceso

      await this.presentToast('Iniciando proceso de pago...');

      // Simular procesamiento con Wompi
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simular pago exitoso
      const success = Math.random() > 0.2; // 80% de éxito

      if (success) {
        await this.paymentsService.updatePaymentStatus(paymentId, 'approved', {
          wompiTransactionId: `wompi_txn_${Date.now()}`,
          wompiReference: `REF_${this.plan.id}_${Date.now()}`
        });

        await this.presentToast('¡Pago exitoso! Créditos asignados correctamente.', 'success');

        // Redirigir después de éxito
        setTimeout(() => {
          this.router.navigate(['/plans'], {
            queryParams: { payment: 'success' }
          });
        }, 2000);

      } else {
        // Simular pago rechazado
        await this.paymentsService.updatePaymentStatus(paymentId, 'rejected', {
          errorMessage: 'Pago rechazado por el banco'
        });

        await this.presentToast('Pago rechazado. Por favor intenta con otro método.', 'danger');
      }

    } catch (error) {
      await this.paymentsService.updatePaymentStatus(paymentId, 'error', {
        errorMessage: 'Error en el procesamiento del pago'
      });
      throw error;
    }
  }

  cancelPayment() {
    if (this.showWompiCheckout) {
      this.backToPlanSummary();
    } else {
      this.router.navigate(['/plans']);
    }
  }

  // Helper para formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Helper para mostrar beneficios del plan
  getPlanBenefits(plan: PlanModel): string[] {
    const baseBenefits = [
      `${plan.creditsTotal} créditos para reservas`,
      'Acceso a todas las clases',
      'Instructores certificados',
      'Soporte 24/7'
    ];

    // Beneficios según el plan
    if (plan.name?.toLowerCase().includes('premium') || plan.creditsTotal >= 50) {
      baseBenefits.push('Acceso prioritario a reservas');
      baseBenefits.push('Áreas premium del gimnasio');
    }

    if (plan.name?.toLowerCase().includes('vip') || plan.creditsTotal >= 100) {
      baseBenefits.push('Entrenador personal incluido');
      baseBenefits.push('Beneficios exclusivos VIP');
    }

    return baseBenefits;
  }

  // Helper simplificado para toasts
  private async presentToast(message: string, color: string = 'warning') {
    await this.utils.presentToast({
      message,
      duration: 3000,
      color: color as any,
      position: 'bottom'
    });
  }
}
