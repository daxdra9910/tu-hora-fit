import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonAlert } from '@ionic/angular/standalone';

import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeModelWithIdAndImage } from '../../../shared/models/employed.model';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-delete-employee',
  standalone: true,
  imports: [
    IonAlert,
    CommonModule
  ],
  templateUrl: './delete-employee.component.html',
  styleUrls: ['./delete-employee.component.scss']
})
export class DeleteEmployeeComponent {
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() employeeData: EmployeeModelWithIdAndImage | null = null;

  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: async () => await this.confirmDelete()
    }
  ];

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async confirmDelete(): Promise<void> {
    if (!this.employeeData) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    this.employeeService.deleteEmployee(this.employeeData)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Empleado eliminado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message || 'Error al eliminar empleado',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  get message(): string {
    return `¿Está seguro de que desea eliminar al empleado ${this.employeeData?.name}?`;
  }
}
