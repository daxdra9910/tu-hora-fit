import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PlansService} from '../../../core/services/plans.service';
import {UtilsService} from '../../../shared/services/utils.service';
import {StateEnum} from '../../../shared/enums/state.enum';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import {PlanModel} from "../../../shared/models/plan.model"; // Asegúrate de ajustar la ruta de importación según tu proyecto

@Component({
  selector: 'app-create-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonList, IonItem, IonInput, IonText, IonSelect, IonSelectOption],
  templateUrl: './create-plan.component.html',
  styleUrls: ['./create-plan.component.scss']
})
export class CreatePlanComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly plansService = inject(PlansService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  // Formulario reactivo para crear el plan
  formGroup: FormGroup;

  // Exponer el enum de estado para usarlo en la plantilla
  StateEnum = StateEnum;

  ngOnInit() {
    this.setupForm();
  }

  setupForm() {
    this.formGroup = this.formBuilder.group({
      name: ['', [Validators.required]],
      duration: ['', [Validators.required]],       // duración del plan (p. ej., en días)
      price: ['', [Validators.required]],          // precio del plan
      description: ['', [Validators.required]],    // descripción del plan
      state: [StateEnum.ACTIVE, [Validators.required]]  // estado inicial (activo por defecto)
    });
  }

  // Método para cerrar el modal
  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  // Método para enviar el formulario y crear el plan en Firebase
  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      // Si el formulario no es válido, marcamos todos los campos como tocados para mostrar errores
      this.formGroup.markAllAsTouched();
      return;
    }
    const planData = this.formGroup.value as PlanModel;
    const loading = await this.utilsService.loading();
    await loading.present();

    this.plansService.createPlan(planData)
      .then(async () => {
        await this.utilsService.presentToast({
          message: "Plan creado correctamente",
          duration: 2500,
          position: "bottom",
          color: "success",
          icon: "checkmark-circle"
        });
        this.toggleOpen();
      })
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        })
      })
      .finally(() => loading.dismiss())
  }
}
