import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonAlert } from '@ionic/angular/standalone';
import { DateTime } from 'luxon';

import { ScheduleClassModelWithId } from 'src/app/modules/shared/models/schedule-class.model';
import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { UtilsService } from 'src/app/modules/shared/services/utils.service';

@Component({
  selector: 'app-delete-schedule',
  standalone: true,
  imports: [IonAlert],
  templateUrl: './delete-schedule.component.html',
  styleUrls: ['./delete-schedule.component.scss'],
})
export class DeleteScheduleComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Input() schedule: ScheduleClassModelWithId | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: async () => await this.delete()
    }
  ];

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async delete(): Promise<void> {
    if (!this.schedule) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    this.scheduleService.deleteSchedule(this.schedule.id)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Horario eliminado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message || 'Error al eliminar el horario',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  get message(): string {
    if (this.schedule?.date) {
      const formattedDate = DateTime.fromISO(this.schedule.date.toString()).toFormat('yyyy-MM-dd');
      return `¿Estás seguro que deseas eliminar el horario programado el ${formattedDate}?`;
    }
    return '';
  }
}
