import { Component, OnInit, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  cardOutline,
  calendarOutline
} from 'ionicons/icons';

import { PaymentsService } from '../../../core/services/payments.service';
import { AuthService } from '../../../auth/services/auth.service';
import { PaymentModel } from '../../../shared/models/payment.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payments-history',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonButtons,
    IonBackButton
  ],
  templateUrl: './payments-history.page.html',
  styleUrls: ['./payments-history.page.scss']
})
export class PaymentsHistoryPage implements OnInit {

  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  payments: PaymentModel[] = [];
  loading = true;

  constructor() {
    addIcons({
      receiptOutline,
      cardOutline,
      calendarOutline
    });
  }

  async ngOnInit() {
    await this.loadPayments();
  }

  async loadPayments() {
    try {
      this.loading = true;

      const authUser = await firstValueFrom(this.authService.authState$);

       console.log('AUTH USER UID:', authUser?.uid);

    if (!authUser) {
      throw new Error('Usuario no autenticado');
    }

    this.payments = await this.paymentsService.getUserPayments(authUser.uid);

    // 👇 Y ESTE TAMBIÉN
    console.log('PAYMENTS FOUND:', this.payments);


      if (!authUser) {
        throw new Error('Usuario no autenticado');
      }

      this.payments = await this.paymentsService.getUserPayments(authUser.uid);

    } catch (error) {
      console.error('❌ Error cargando historial de pagos:', error);
      this.payments = [];
    } finally {
      this.loading = false;
    }
  }

  // =====================
  // HELPERS PARA TEMPLATE
  // =====================

  getStatusText(status: string): string {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'rejected': return 'Rechazado';
      case 'cancelled': return 'Cancelado';
      case 'error': return 'Error';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'pending':
      case 'processing': return 'warning';
      case 'rejected':
      case 'cancelled':
      case 'error': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(date: any): string {
    if (!date) return '—';

    const jsDate =
      typeof date?.toDate === 'function'
        ? date.toDate()
        : new Date(date);

    return jsDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP'
    });
  }
}
