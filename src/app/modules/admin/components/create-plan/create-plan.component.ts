// src/app/modules/admin/components/create-plan/create-plan.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Ionic (standalone)
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonList, IonItem, IonInput, IonText, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { PlansService } from '../../../core/services/plans.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { StateEnum } from '../../../shared/enums/state.enum';
import { PlanCreateDTO } from '../../../shared/models/plan.model';

@Component({
  selector: 'app-create-plan',
  standalone: true,
  imports: [
    // Ionic
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonList, IonItem, IonInput, IonText, IonSelect, IonSelectOption,
    // Angular
    CommonModule, ReactiveFormsModule
  ],
  templateUrl: './create-plan.component.html',
  styleUrls: ['./create-plan.component.scss']
})
export class CreatePlanComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  planForm: FormGroup;
  StateEnum = StateEnum;

  constructor(
    private fb: FormBuilder,
    private plansService: PlansService,
    private utils: UtilsService
  ) {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      creditsTotal: [1, [Validators.required, Validators.min(1)]],  // ← reemplaza duración
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      state: [StateEnum.ACTIVE, [Validators.required]],
    });
  }

  toggleOpen(): void {
    this.isOpenChange.emit(false);
  }

  async onSubmit(): Promise<void> {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const { name, creditsTotal, price, description, state } = this.planForm.value;

    const payload: PlanCreateDTO = {
      name: String(name).trim(),
      creditsTotal: Number(creditsTotal),
      price: Number(price),
      description: String(description ?? '').trim(),
      state,
    };

    const loading = await this.utils.loading();
    try {
      await this.plansService.createPlan(payload);
      await this.utils.presentToast({
        message: 'Plan creado con éxito',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.planForm.reset({
        name: '',
        creditsTotal: 1,
        price: 0,
        description: '',
        state: StateEnum.ACTIVE,
      });
      this.toggleOpen();
    } catch (error) {
      console.error('Error al crear el plan:', error);
      await this.utils.presentToast({
        message: 'Error al crear el plan',
        duration: 2500,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      (loading as any)?.dismiss?.();
    }
  }
}
