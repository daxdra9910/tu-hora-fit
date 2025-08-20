import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, pencil } from 'ionicons/icons';

import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { ClassService } from 'src/app/modules/core/services/class.service';
import { EmployeeService } from 'src/app/modules/core/services/employee.service';

import { ScheduleClassModelWithId } from 'src/app/modules/shared/models/schedule-class.model';
import { ClassModelWithIdAndImage } from 'src/app/modules/shared/models/class.model';
import { EmployeeModelWithIdAndImage } from 'src/app/modules/shared/models/employed.model';

import { UtilsService } from 'src/app/modules/shared/services/utils.service';

import { CreateScheduleComponent } from '../../components/create-schedule/create-schedule.component';
import { ModifyScheduleComponent } from '../../components/modify-schedule/modify-schedule.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonList,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonText,
    IonButtons,
    IonLabel,
    CreateScheduleComponent,
    ModifyScheduleComponent
  ]
})
export class SchedulePage implements OnInit {
  // Services
  private readonly scheduleService = inject(ScheduleService);
  private readonly classService = inject(ClassService);
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);

  constructor() {
    // Registrar iconos usados en esta página
    addIcons({addOutline,pencil,trashOutline,createOutline});
  }

  // Refs
  @ViewChild('scheduleList') scheduleList!: IonList;

  // Data
  schedules: ScheduleClassModelWithId[] = [];
  filteredSchedules: ScheduleClassModelWithId[] = [];

  // Lookups para mostrar nombres
  classesMap = new Map<string, string>();
  employeesMap = new Map<string, string>();

  // UI State
  isCreating = false;
  isEditing = false;
  selectedSchedule: ScheduleClassModelWithId | null = null;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadLookups(), this.getSchedules()]);
  }

  private async loadLookups(): Promise<void> {
    try {
      const [classes, employees] = await Promise.all([
        this.classService.getAllClasses() as Promise<ClassModelWithIdAndImage[]>,
        this.employeeService.getAllEmployees() as Promise<EmployeeModelWithIdAndImage[]>
      ]);

      classes?.forEach(c => {
        const id = (c as any).id ?? (c as any).uid ?? '';
        const name = (c as any).name ?? (c as any).title ?? (c as any).displayName ?? 'Sin nombre';
        if (id) this.classesMap.set(id, name);
      });

      employees?.forEach(e => {
        const id = (e as any).id ?? (e as any).uid ?? '';
        const name =
          (e as any).name ??
          (e as any).displayName ??
          (([(e as any).first_name, (e as any).last_name].filter(Boolean).join(' ')) || 'Sin nombre');

        if (id) this.employeesMap.set(id, name);
      });
    } catch (err) {
      console.warn('No se pudieron cargar clases o empleados:', err);
    }
  }

  async getSchedules(): Promise<void> {
    const loading = await this.utilsService.loading();
    await loading.present();

    this.scheduleService.getAllSchedules()
      .then(schedules => {
        this.schedules = schedules ?? [];
        this.filteredSchedules = schedules ?? [];
      })
      .catch(err => {
        this.utilsService.presentToast({
          message: err?.message || 'Error al obtener los horarios',
          color: 'danger',
          icon: 'alert-circle-outline',
          duration: 3000
        });
      })
      .finally(() => loading.dismiss());
  }

  // Búsqueda por NOMBRE de clase/instructor
  handleInput(event: Event | CustomEvent): void {
    const query = (event as CustomEvent).detail?.value?.toLowerCase?.() || '';

    this.filteredSchedules = this.schedules.filter(s => {
      const className = (this.classesMap.get(s.class_id) || '').toLowerCase();
      const employeeName = (this.employeesMap.get(s.employee_id) || '').toLowerCase();
      return className.includes(query) || employeeName.includes(query);
    });
  }

  // Crear
  openCreate(): void {
    this.isCreating = true;
  }

  closeCreate(): void {
    this.isCreating = false;
    this.getSchedules();
  }

  // Editar
  async openEdit(schedule: ScheduleClassModelWithId): Promise<void> {
    await this.scheduleList?.closeSlidingItems();
    this.selectedSchedule = schedule;
    this.isEditing = true;
  }

  closeEdit(): void {
    this.isEditing = false;
    this.selectedSchedule = null;
    this.getSchedules();
  }

  // Eliminar
  async deleteSchedule(schedule: ScheduleClassModelWithId): Promise<void> {
    await this.scheduleList?.closeSlidingItems();

    const loading = await this.utilsService.loading();
    await loading.present();

    this.scheduleService.deleteSchedule(schedule.id)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Horario eliminado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.getSchedules();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error?.message || 'Error al eliminar el horario',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  // TrackBy
  trackById(index: number, item: ScheduleClassModelWithId): string {
    return item.id;
  }
}
