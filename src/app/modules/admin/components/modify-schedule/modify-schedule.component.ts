import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ClassService } from 'src/app/modules/core/services/class.service';
import { EmployeeService } from 'src/app/modules/core/services/employee.service';
import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { UtilsService } from 'src/app/modules/shared/services/utils.service';

import { RecurrenceEnum } from 'src/app/modules/shared/enums/recurrence.enum';
import { ClassModelWithIdAndImage } from 'src/app/modules/shared/models/class.model';
import { EmployeeModelWithIdAndImage } from 'src/app/modules/shared/models/employed.model';
import { ScheduleClassModelWithId } from 'src/app/modules/shared/models/schedule-class.model';

@Component({
  selector: 'app-modify-schedule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonList,
    IonInput,
    IonItem,
    IonIcon,
    IonButton,
    IonButtons,
    IonTitle,
    IonModal,
    IonToolbar,
    IonContent,
    IonHeader,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './modify-schedule.component.html',
  styleUrls: ['./modify-schedule.component.scss'],
})
export class ModifyScheduleComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly utilsService = inject(UtilsService);
  private readonly classService = inject(ClassService);
  private readonly employeeService = inject(EmployeeService);
  private readonly scheduleService = inject(ScheduleService);

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() schedule: ScheduleClassModelWithId | null = null;

  formGroup: FormGroup;
  classes: ClassModelWithIdAndImage[] = [];
  employees: EmployeeModelWithIdAndImage[] = [];
  recurrences = RecurrenceEnum;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedule'] && this.schedule) {
      this.initForm(this.schedule);
    }
  }

  private initForm(schedule: ScheduleClassModelWithId): void {
    this.formGroup = this.formBuilder.group({
      class_id: [schedule.class_id, Validators.required],
      employee_id: [schedule.employee_id, Validators.required],
      date: [schedule.date, Validators.required],
      start_time: [schedule.start_time, Validators.required],
      end_time: [schedule.end_time, Validators.required],
      max_capacity: [schedule.max_capacity, [Validators.required, Validators.min(1)]],
      recurrence: [schedule.recurrence, Validators.required],
      end_recurrence: [schedule.end_recurrence],
    });

    this.loadLists();
  }

  private loadLists(): void {
    this.classService.getAllClasses().then(classes => this.classes = classes);
    this.employeeService.getAllEmployees().then(employees => this.employees = employees);
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async onSubmit(): Promise<void> {
    if (!this.schedule || this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    const data = this.formGroup.value;

    this.scheduleService.updateSchedule(this.schedule.id, data)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Horario actualizado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message || 'Error al actualizar el horario',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }
}
