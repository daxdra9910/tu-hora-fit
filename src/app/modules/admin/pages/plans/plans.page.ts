import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItemSliding,
  IonSearchbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonRow,
  IonCol,
  IonText,
  IonGrid,
  IonList,
  IonItemOptions,
  IonItemOption,
  IonItem,
  SearchbarInputEventDetail, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonAvatar, IonLabel } from '@ionic/angular/standalone';
import { IonSearchbarCustomEvent } from '@ionic/core';

import { CreatePlanComponent } from '../../components/create-plan/create-plan.component';
import { ModifyPlanComponent } from '../../components/modify-plan/modify-plan.component';
import { DeletePlanComponent } from '../../components/delete-plan/delete-plan.component';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
  standalone: true,
  imports: [IonLabel, IonAvatar, IonChip, IonCardContent, IonCardTitle, IonCardHeader, IonCard,
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItemSliding,
    IonSearchbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonRow,
    IonCol,
    IonText,
    IonGrid,
    IonList,
    IonItemOptions,
    IonItemOption,
    IonItem,
    CreatePlanComponent,
    ModifyPlanComponent,
    DeletePlanComponent
  ]
})
export class PlansPage implements OnInit {
  @ViewChild('planList') planList!: IonList;

  plans = [
    {
      id: '1',
      name: 'Plan Básico',
      duration: 30,
      price: 50000,
      description: 'Acceso al gimnasio por 30 días',
      state: 'active'
    },
    {
      id: '2',
      name: 'Plan Premium',
      duration: 90,
      price: 120000,
      description: 'Acceso completo por 3 meses',
      state: 'inactive'
    }
  ];


  filteredPlans = [...this.plans];
  selectedPlan: any = null;

  isCreating = false;
  isEditing = false;
  isDeleting = false;

  constructor() {}

  ngOnInit(): void {}

  handleInput(event: IonSearchbarCustomEvent<SearchbarInputEventDetail>) {
    const value = event.detail.value?.toLowerCase() || '';
    this.filteredPlans = this.plans.filter(plan =>
      plan.name.toLowerCase().includes(value)
    );
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
  }

  openEdit(plan: any) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.selectedPlan = null;
  }

  openDelete(plan: any) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.selectedPlan = null;
  }
}
