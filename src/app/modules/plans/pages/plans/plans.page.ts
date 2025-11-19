import { Component, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonSpinner,
  IonSkeletonText, IonCol, IonGrid, IonRow
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, sparkles, card, arrowForward } from 'ionicons/icons';

import { PlansService } from '../../../core/services/plans.service';
import { PlanModel } from '../../../shared/models/plan.model';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon,IonSkeletonText,
    IonGrid, IonRow, IonCol
  ]
})
export class PlansPage implements OnInit {
  private readonly plansService = inject(PlansService);
  private readonly utils = inject(UtilsService);
  private readonly router = inject(Router);

  @ViewChildren(IonItemSliding) slidings!: QueryList<IonItemSliding>;

  loading = false;
  plans: PlanModel[] = [];
  selectedPlan: PlanModel | null = null;

  constructor() {
    addIcons({ star, sparkles, card, arrowForward });
  }

  async ngOnInit() {
    await this.loadPlans();
  }

  async loadPlans() {
    this.loading = true;
    try {
      this.plans = await this.plansService.getAllPlans();
      // Filtrar solo planes activos para clientes
      this.plans = this.plans.filter(plan => plan.state === 'active');
    } catch (error: any) {
      console.error('Error loading plans:', error);
      await this.utils.presentToast({
        message: 'Error al cargar los planes',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    } finally {
      this.loading = false;
    }
  }

  openSlide(sliding: IonItemSliding) {
    try { sliding.open('end'); } catch {}
  }

  selectPlan(plan: PlanModel) {
    this.selectedPlan = plan;
  }

  async proceedToPayment(plan: PlanModel) {
    // Navegar a la página de pago con el ID del plan
    this.router.navigate(['/plans/payment', plan.id]);
  }

  getPlanIcon(plan: PlanModel): string {
    if (plan.creditsTotal >= 100) return 'sparkles';
    if (plan.creditsTotal >= 50) return 'star';
    return 'card';
  }

  getPlanColor(plan: PlanModel): string {
    if (plan.creditsTotal >= 100) return 'premium';
    if (plan.creditsTotal >= 50) return 'business';
    return 'basic';
  }
}
