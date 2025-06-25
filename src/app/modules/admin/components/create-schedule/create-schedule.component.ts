import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/angular/standalone";
import { ClassService } from 'src/app/modules/core/services/class.service';
import { EmployeeService } from 'src/app/modules/core/services/employee.service';
import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { RecurrenceEnum } from 'src/app/modules/shared/enums/recurrence.enum';
import { ClassModelWithIdAndImage } from 'src/app/modules/shared/models/class.model';
import { EmployeeModelWithIdAndImage } from 'src/app/modules/shared/models/employed.model';
import { ScheduleClassModel } from 'src/app/modules/shared/models/schedule-class.model';
import { UtilsService } from 'src/app/modules/shared/services/utils.service';

@Component({
  selector: 'app-create-schedule',
  standalone: true,
  imports: [IonList, IonInput, IonItem, IonIcon, IonButton, IonButtons, IonTitle, IonModal, IonToolbar, IonContent, IonHeader, IonSelect, IonSelectOption, ReactiveFormsModule, CommonModule],
  templateUrl: './create-schedule.component.html',
  styleUrls: ['./create-schedule.component.scss'],
})
export class CreateScheduleComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly utilsService = inject(UtilsService);
  private readonly classService = inject(ClassService);
  private readonly employeeService = inject(EmployeeService);
  private readonly scheduleService = inject(ScheduleService);

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<void>()

  formGroup: FormGroup;
  classes: ClassModelWithIdAndImage[] = [];
  employees: EmployeeModelWithIdAndImage[] = [];

  recurrences = RecurrenceEnum;

  ngOnInit(): void {
    this.setupForm();
    this.getClassess();
    this.getEmployees();
  }

  setupForm(): void {
    this.formGroup = this.formBuilder.group({
      class_id: [null, Validators.required],
      employee_id: [null, Validators.required],
      date: [null, Validators.required],
      start_time: [null, Validators.required],
      end_time: [null, Validators.required],
      max_capacity: [20, [Validators.required, Validators.min(1)]],
      recurrence: [this.recurrences.ONCE, Validators.required],
      end_recurrence: [null],
    })
  }

  getClassess(): void {
    this.classService.getAllClasses()
      .then((classes) => {
        this.classes = classes;
      })
  }

  getEmployees() {
    this.employeeService.getAllEmployees()
      .then((employees) => {
        this.employees = employees;
      })
  }

  toggleOpen() {
    this.isOpenChange.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    const data: ScheduleClassModel = {
      ...this.formGroup.value
    }

    this.scheduleService.createSchedule(data)
    .then(() => {
        this.utilsService.presentToast({
          message: 'Horario creado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message || 'Error al crear el horario',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

}
