import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonText,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonLabel,
  IonSearchbar, IonCard } from '@ionic/angular/standalone';

import { DateTime } from 'luxon';

import { CreateScheduleComponent } from '../../components/create-schedule/create-schedule.component';
import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { ClassService } from 'src/app/modules/core/services/class.service';
import { EmployeeService } from 'src/app/modules/core/services/employee.service';

import { ScheduleClassModelWithId } from 'src/app/modules/shared/models/schedule-class.model';
import { ClassModelWithIdAndImage } from 'src/app/modules/shared/models/class.model';
import { EmployeeModelWithIdAndImage } from 'src/app/modules/shared/models/employed.model';
import { RecurrenceEnum } from 'src/app/modules/shared/enums/recurrence.enum';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonText,
    IonIcon,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonItemSliding,
    IonLabel,
    IonSearchbar,
    CreateScheduleComponent,
  ]
})
export class SchedulePage implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private readonly classService = inject(ClassService);
  private readonly employeeService = inject(EmployeeService);

  schedules: ScheduleClassModelWithId[] = [];
  filteredSchedules: ScheduleClassModelWithId[] = [];

  classesMap = new Map<string, string>();
  employeesMap = new Map<string, string>();

  isCreating = false;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    const [schedules, classes, employees] = await Promise.all([
      this.scheduleService.getAllSchedules(),
      this.classService.getAllClasses(),
      this.employeeService.getAllEmployees()
    ]);

    this.schedules = schedules;
    this.filteredSchedules = schedules;

    this.classesMap = new Map(classes.map(cls => [cls.id, cls.name]));
    this.employeesMap = new Map(employees.map(emp => [emp.id, emp.name]));
  }

  openCreate(): void {
    this.isCreating = true;
  }

  closeCreate(): void {
    this.isCreating = false;
    this.loadData();
  }

  handleSearch(event: Event): void {
    const value = (event.target as HTMLIonSearchbarElement).value?.toLowerCase() || '';
    this.filteredSchedules = this.schedules.filter(s =>
      this.classesMap.get(s.class_id)?.toLowerCase().includes(value) ||
      this.employeesMap.get(s.employee_id)?.toLowerCase().includes(value)
    );
  }

  trackById(_: number, item: ScheduleClassModelWithId) {
    return item.id;
  }

  formatDate(date: string | Date): string {
    const iso = typeof date === 'string' ? date : date.toISOString();
    return DateTime.fromISO(iso).toLocaleString(DateTime.DATE_MED); // Ej: Jun 6, 2025
  }

  formatTimeRange(start: string, end: string): string {
  const formattedStart = DateTime.fromFormat(start, 'HH:mm').toFormat('h:mm a');
  const formattedEnd = DateTime.fromFormat(end, 'HH:mm').toFormat('h:mm a');
  return `${formattedStart} - ${formattedEnd}`;
}

  getRecurrenceLabel(code: RecurrenceEnum): string {
    const map = {
      [RecurrenceEnum.ONCE]: 'Una vez',
      [RecurrenceEnum.DAILY]: 'Diaria',
      [RecurrenceEnum.WEEKLY]: 'Semanal',
      [RecurrenceEnum.MONTHLY]: 'Mensual'
    };
    return map[code] || 'Desconocido';
  }
}
