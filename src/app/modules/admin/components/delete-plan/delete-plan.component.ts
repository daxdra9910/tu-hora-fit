import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonAlert } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PlanModel } from '../../../shared/models/plan.model';
import { PlansService } from '../../../core/services/plans.service';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-delete-plan',
  standalone: true,
  templateUrl: './delete-plan.component.html',
  styleUrls: ['./delete-plan.component.scss'],
  imports: [IonAlert, CommonModule]
})
export class DeletePlanComponent {
  @Input() isOpen = false;
  @Input() plan: PlanModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  constructor(
    private readonly plansService: PlansService,
    private readonly utilsService: UtilsService
  ) {}

  toggleOpen() {
    this.isOpenChange.emit();
  }

  async delete() {
    if (!this.plan) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    this.plansService.deletePlan(this.plan)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Plan eliminado correctamente',
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

  get message(): string {
    return this.plan
      ? `¿Estás segura que deseas eliminar el plan "${this.plan.name}"?`
      : '';
  }

  get alertButtons() {
    return [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aceptar',
        role: 'confirm',
        handler: async () => await this.delete()
      }
    ];
  }
}
