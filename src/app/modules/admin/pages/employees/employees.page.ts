import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonRow,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar,
  IonAvatar
} from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../../core/services/employee.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { EmployeeModel } from '../../../shared/models/employed.model';

import { CreateEmployeeComponent } from '../../components/create-employee/create-employee.component';
import { ModifyEmployeeComponent } from '../../components/modify-employee/modify-employee.component';
import { DeleteEmployeeComponent } from '../../components/delete-employee/delete-employee.component';

@Component({
  selector: 'app-employees-page',
  templateUrl: './employees.page.html',
  styleUrls: ['./employees.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSearchbar,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonText,
    IonItemOptions,
    IonItemOption,
    IonAvatar,
    CreateEmployeeComponent,
    ModifyEmployeeComponent,
    DeleteEmployeeComponent
  ]
})
export class EmployeesPage implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);

  @ViewChild(IonList) employeeList!: IonList;

  employees: EmployeeModel[] = [];
  selectedEmployee: EmployeeModel | null = null;

  isCreating = false;
  isEditing = false;
  isDeleting = false;

  ngOnInit() {
    this.getEmployees();
  }

  async getEmployees(name: string = '') {
    const loading = await this.utilsService.loading();
    await loading.present();

    this.employeeService.getAllEmployees()
      .then(data => {
        if (name.trim()) {
          this.employees = data.filter(emp =>
            emp.name.toLowerCase().includes(name.toLowerCase())
          );
        } else {
          this.employees = data;
        }
      })
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value || '';
    this.getEmployees(query);
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
    this.getEmployees();
  }

  openEdit(emp: EmployeeModel) {
    this.employeeList?.closeSlidingItems().then(() => {
      this.selectedEmployee = emp;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.selectedEmployee = null;
    this.getEmployees();
  }

  openDelete(emp: EmployeeModel) {
    this.employeeList?.closeSlidingItems().then(() => {
      this.selectedEmployee = emp;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.selectedEmployee = null;
    this.getEmployees();
  }

  trackById(index: number, item: EmployeeModel): string {
    return item.id!;
  }
}
