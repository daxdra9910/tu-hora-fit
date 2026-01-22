import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonIcon, IonButtons
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { addIcons } from 'ionicons';
import { card, arrowBack } from 'ionicons/icons';

import { PlansService } from '../../../core/services/plans.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { CreditsService } from '../../../core/services/credits.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonIcon, IonButtons
  ]
})
export class PaymentPage implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plansService = inject(PlansService);
  private paymentsService = inject(PaymentsService);
  private creditsService = inject(CreditsService);
  private auth = inject(AuthService);
  private utils = inject(UtilsService);
  private http = inject(HttpClient);

  private authSub!: Subscription;

  plan: any;
  user: any;
  loading = true;
  processing = false;

  constructor() {
    addIcons({ card, arrowBack });
  }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id')!;

    this.authSub = this.auth.authState$.subscribe(async (firebaseUser) => {
      if (!firebaseUser) {
        this.router.navigate(['/login']);
        return;
      }

      this.user = firebaseUser;
      this.plan = await this.plansService.getPlan(planId);
      this.loading = false;
    });
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
    this.removeWompiScroll();
  }

  async payWithWompi() {
    if (!this.plan || !this.user || this.processing) return;

    // 🔒 VALIDACIÓN ANTES DE COBRAR
    const validation = await this.creditsService.canUserPurchase(
      this.user.uid,
      this.plan.id
    );

    if (!validation.canPurchase) {
      await this.utils.presentToast({
        message: validation.reason,
        color: 'warning',
        duration: 4000
      });
      return;
    }

    this.processing = true;

    try {
      // 1️⃣ Crear pago local
      const paymentId = await this.paymentsService.createPayment({
        planId: this.plan.id,
        planName: this.plan.name,
        amount: this.plan.price,
        credits: this.plan.creditsTotal,
        userId: this.user.uid,
        userEmail: this.user.email
      });

      // 2️⃣ Normalizar monto
      const amountInCents = String(
        Math.round(Number(this.plan.price) * 100)
      );

      // 3️⃣ Pedir firma al backend
      const response: any = await this.http.post(
        'https://us-central1-tu-hora-fit.cloudfunctions.net/generateIntegritySignature',
        {
          reference: paymentId,
          amountInCents,
          currency: 'COP'
        }
      ).toPromise();

      const integritySignature = response.signature;

      console.log('================ WOMPI DEBUG ================');
      console.log('ENV COMPLETO 👉', environment);
      console.log('WOMPI 👉', environment.wompi);
      console.log('PUBLIC KEY 👉', environment.wompi?.publicKey);
      console.log('============================================');

      // 4️⃣ Abrir widget
      const checkout = new (window as any).WidgetCheckout({
        publicKey: environment.wompi.publicKey,
        currency: 'COP',
        amountInCents: Number(amountInCents),
        reference: paymentId,
        signature: {
          integrity: integritySignature
        }
      });

      this.enableWompiScroll();

      checkout.open(async (result: any) => {
        this.removeWompiScroll();

        const transaction = result?.transaction;

        if (transaction?.status === 'APPROVED') {

          await this.paymentsService.updatePaymentStatus(paymentId, 'approved', {
            wompiTransactionId: transaction.id,
            wompiReference: transaction.reference,
            paymentMethod: 'wompi'
          });

          await this.creditsService.assignCreditsFromPayment(
            this.user.uid,
            paymentId,
            this.plan.name,
            this.plan.creditsTotal,
            30,
            'wompi'
          );

          await this.utils.presentToast({
            message: 'Pago exitoso 🎉',
            color: 'success',
            duration: 3000
          });

          this.router.navigate(['/plans/success'], { replaceUrl: true });

        } else {
          await this.utils.presentToast({
            message: 'El pago no fue aprobado',
            color: 'warning',
            duration: 3000
          });
        }

        this.processing = false;
      });

    } catch (error) {
      console.error('Error en pago:', error);
      this.processing = false;
      this.removeWompiScroll();

      await this.utils.presentToast({
        message: 'No se pudo completar el pago. Inténtalo nuevamente.',
        color: 'danger',
        duration: 3000
      });
    }
  }

  private enableWompiScroll() {
    document.body.classList.add('wompi-open');
    document.documentElement.classList.add('wompi-open');
  }

  private removeWompiScroll() {
    document.body.classList.remove('wompi-open');
    document.documentElement.classList.remove('wompi-open');
  }

  back() {
    this.router.navigate(['/plans']);
  }
}
