import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItemSliding, IonSearchbar,
  IonButtons, IonButton, IonIcon, IonText, IonList, IonItemOptions, IonItemOption, IonItem,
  IonChip, IonLabel
} from '@ionic/angular/standalone';
import { IonSearchbarCustomEvent } from '@ionic/core';
import { SearchbarInputEventDetail } from '@ionic/angular';

import { CreatePlanComponent } from '../../components/create-plan/create-plan.component';
import { ModifyPlanComponent } from '../../components/modify-plan/modify-plan.component';
import { DeletePlanComponent } from '../../components/delete-plan/delete-plan.component';

import { PlansService } from '../../../core/services/plans.service';
import { PlanModel } from '../../../shared/models/plan.model';
import { StateEnum } from '../../../shared/enums/state.enum';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonItemSliding, IonSearchbar,
    IonButtons, IonButton, IonIcon, IonText, IonList, IonItemOptions, IonItemOption, IonItem,
    IonChip, IonLabel,
    CreatePlanComponent, ModifyPlanComponent, DeletePlanComponent
  ],
})
export class PlansPage implements OnInit {
  @ViewChild('planList') planList!: IonList;

  StateEnum = StateEnum;

  plans: PlanModel[] = [];
  filteredPlans: PlanModel[] = [];
  selectedPlan: PlanModel | null = null;

  isCreating = false;
  isEditing  = false;
  isDeleting = false;

  constructor(private readonly plansService: PlansService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    try {
      this.plans = await this.plansService.getAllPlans();
      this.filteredPlans = [...this.plans];
    } catch (e) {
      console.error('Error cargando planes', e);
      this.filteredPlans = [];
    }
  }

  handleInput(event: IonSearchbarCustomEvent<SearchbarInputEventDetail>) {
    const q = (event.detail.value ?? '').toString().toLowerCase().trim();
    if (!q) { this.filteredPlans = [...this.plans]; return; }

    this.filteredPlans = this.plans.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      `${p.creditsTotal}`.includes(q) ||
      `${p.price}`.includes(q)
    );
  }

  openCreate() { this.isCreating = true; }
  closeCreate() { this.isCreating = false; this.reload(); }

  openEdit(plan: PlanModel) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isEditing = true;
    });
  }
  closeEdit() { this.isEditing = false; this.selectedPlan = null; this.reload(); }

  openDelete(plan: PlanModel) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isDeleting = true;
    });
  }
  closeDelete() { this.isDeleting = false; this.selectedPlan = null; this.reload(); }
}
