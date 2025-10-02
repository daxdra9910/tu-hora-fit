import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText
} from '@ionic/angular/standalone';

import { StateEnum } from '../../../shared/enums/state.enum';
import { PlanModel, PlanUpdateDTO } from '../../../shared/models/plan.model';
import { PlansService } from '../../../core/services/plans.service';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-modify-plan',
  standalone: true,
  templateUrl: './modify-plan.component.html',
  styleUrls: ['./modify-plan.component.scss'],
  imports: [
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText,
    CommonModule, ReactiveFormsModule
  ]
})
export class ModifyPlanComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() plan: PlanModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  form!: FormGroup;
  StateEnum = StateEnum;

  constructor(
    private readonly fb: FormBuilder,
    private readonly plansService: PlansService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      creditsTotal: [1, [Validators.required, Validators.min(1)]], // ← reemplaza duration
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      state: [StateEnum.ACTIVE, [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['plan']?.currentValue && this.form) {
      const p = changes['plan'].currentValue as PlanModel;
      this.form.reset({
        name: p.name ?? '',
        creditsTotal: p.creditsTotal ?? 1,
        price: p.price ?? 0,
        description: p.description ?? '',
        state: p.state ?? StateEnum.ACTIVE
      });
    }
  }

  toggleOpen() { this.isOpenChange.emit(); }

  async onSubmit() {
    if (!this.plan?.id || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, creditsTotal, price, description, state } = this.form.value;
    const patch: PlanUpdateDTO = {
      name: String(name).trim(),
      creditsTotal: Number(creditsTotal),
      price: Number(price),
      description: String(description ?? '').trim(),
      state
    };

    const loading = await this.utils.loading(); await loading?.present?.();
    try {
      await this.plansService.updatePlan(this.plan.id, patch);
      await this.utils.presentToast({
        message: 'Plan actualizado correctamente',
        duration: 2500, position: 'bottom', color: 'success', icon: 'checkmark-circle'
      });
      this.toggleOpen();
    } catch (err: any) {
      await this.utils.presentToast({
        message: err?.message ?? 'Error al actualizar el plan',
        duration: 2500, position: 'bottom', color: 'danger', icon: 'alert-circle-outline'
      });
    } finally {
      loading?.dismiss?.();
    }
  }
}
