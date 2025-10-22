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

import { ClassService } from '../../../core/services/class.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { ClassModel } from '../../../shared/models/class.model';

import { CreateClassComponent } from '../../components/create-class/create-class.component';
import { ModifyClassComponent } from '../../components/modify-class/modify-class.component';
import { DeleteClassComponent } from '../../components/delete-class/delete-class.component';

@Component({
  selector: 'app-class-page',
  templateUrl: './class-page.page.html',
  styleUrls: ['./class-page.page.scss'],
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
    CreateClassComponent,
    ModifyClassComponent,
    DeleteClassComponent
  ]
})
export class ClassPage implements OnInit {
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);

  @ViewChild('classList') classList!: IonList;

  classes: ClassModel[] = [];

  instructors = [
    { uid: 'inst-001', displayName: 'Carlos Pérez' },
    { uid: 'inst-002', displayName: 'Laura Gómez' },
    { uid: 'inst-003', displayName: 'Andrés Ruiz' }
  ];

  getInstructorName(uid: string): string {
    const found = this.instructors.find(inst => inst.uid === uid);
    return found ? found.displayName : uid;
  }

  selectedClass: ClassModel | null = null;

  isCreating = false;
  isEditing = false;
  isDeleting = false;

  ngOnInit() {
    this.getClasses();
  }

  async getClasses(name: string = '') {
    const loading = await this.utilsService.loading();
    await loading.present();

    this.classService.getAllClasses()
      .then(data => {
        if (name.trim()) {
          this.classes = data.filter(cls =>
            cls.name.toLowerCase().includes(name.toLowerCase())
          );
        } else {
          this.classes = data;
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
    this.getClasses(query);
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
    this.getClasses();
  }

  openEdit(cls: ClassModel) {
    this.classList?.closeSlidingItems().then(() => {
      this.selectedClass = cls;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.selectedClass = null;
    this.getClasses();
  }

  openDelete(cls: ClassModel) {
    this.classList?.closeSlidingItems().then(() => {
      this.selectedClass = cls;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.selectedClass = null;
    this.getClasses();
  }

  trackById(index: number, item: ClassModel): string {
    return item.id;
  }
}
