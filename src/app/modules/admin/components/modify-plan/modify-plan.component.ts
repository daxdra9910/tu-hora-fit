import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/angular/standalone';

import { StateEnum } from '../../../shared/enums/state.enum';
import { PlanModel } from '../../../shared/models/plan.model';
import { PlansService } from '../../../core/services/plans.service';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-modify-plan',
  standalone: true,
  templateUrl: './modify-plan.component.html',
  styleUrls: ['./modify-plan.component.scss'],
  imports: [
    // Ionic components
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,

    // Angular modules
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ModifyPlanComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() plan: PlanModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  form!: FormGroup;
  StateEnum = StateEnum;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly plansService: PlansService,
    private readonly utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['plan'] && this.plan && this.form) {
      this.form.patchValue({
        name: this.plan.name,
        duration: this.plan.duration,
        price: this.plan.price,
        description: this.plan.description,
        state: this.plan.state
      });
    }
  }

  setupForm() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      duration: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      state: ['', Validators.required]
    });
  }

  toggleOpen() {
    this.isOpenChange.emit();
  }

  async onSubmit() {
    if (!this.plan || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const updatedPlan: PlanModel = {
      ...this.plan,
      ...this.form.value,
      updatedAt: new Date()
    };

    const loading = await this.utilsService.loading();
    await loading.present();

    this.plansService.updatePlan(updatedPlan)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Plan actualizado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch(async error => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }
}
