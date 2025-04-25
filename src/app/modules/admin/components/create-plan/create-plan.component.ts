import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlansService } from '../../../core/services/plans.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { StateEnum } from '../../../shared/enums/state.enum';  // Asegúrate de ajustar la ruta de importación según tu proyecto

@Component({
  selector: 'app-create-plan',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './create-plan.component.html',
  styleUrls: ['./create-plan.component.scss']
})
export class CreatePlanComponent {
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  // Formulario reactivo para crear el plan
  planForm: FormGroup;

  // Exponer el enum de estado para usarlo en la plantilla
  StateEnum = StateEnum;

  constructor(private fb: FormBuilder, private plansService: PlansService, private utils: UtilsService) {
    // Inicializar el FormGroup con campos y validaciones
    this.planForm = this.fb.group({
      name: ['', [Validators.required]],
      duration: ['', [Validators.required]],       // duración del plan (p. ej., en días)
      price: ['', [Validators.required]],          // precio del plan
      description: ['', [Validators.required]],    // descripción del plan
      state: [StateEnum.ACTIVE, [Validators.required]]  // estado inicial (activo por defecto)
    });
  }

  // Método para cerrar el modal (emite false al padre)
  toggleOpen(): void {
    this.isOpenChange.emit(false);
  }

  // Método para enviar el formulario y crear el plan en Firebase
  async onSubmit(): Promise<void> {
    if (this.planForm.invalid) {
      // Si el formulario no es válido, marcamos todos los campos como tocados para mostrar errores
      this.planForm.markAllAsTouched();
      return;
    }
    const planData = this.planForm.value;
    await this.utils.loading();  // Muestra loading indicator
    try {
      await this.plansService.createPlan(planData);
      this.utils.presentToast({
        message: 'Plan creado con éxito',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      // Limpiar el formulario y cerrar el modal
      this.planForm.reset();
      this.toggleOpen();
    } catch (error) {
      console.error('Error al crear el plan:', error);
      this.utils.presentToast({
        message: 'Error al crear el plan',
        duration: 2500,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });

    } finally {
      // Ocultar loading indicator si corresponde (asumiendo UtilsService.loading() devuelve un overlay)
      // Por ejemplo, si UtilsService.loading() muestra un loader, podría haber un UtilsService.dismissLoading()
      // await this.utils.dismissLoading();  (Descomentar si existe este método)
    }
  }
}
