import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAlert } from '@ionic/angular/standalone';

import { ClassService } from '../../../core/services/class.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { ClassModel } from '../../../shared/models/class.model';

@Component({
  selector: 'app-delete-class',
  standalone: true,
  imports: [IonAlert, 
    CommonModule
  ],
  templateUrl: './delete-class.component.html',
  styleUrls: ['./delete-class.component.scss']
})
export class DeleteClassComponent {
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() classData: ClassModel | null = null;

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
    if (!this.classData) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    this.classService.deleteClass(this.classData)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Clase eliminada correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'trash-bin'
        });
        this.toggleOpen();
      })
      .catch(async (error) => {
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
    return `¿Está seguro de que desea eliminar la clase ${this.classData?.name}?`;
  }
}
