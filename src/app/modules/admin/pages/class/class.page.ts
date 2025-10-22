import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {
  IonAvatar,
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

import { FormsModule } from '@angular/forms';

import { ClassService } from '../../../core/services/class.service';
import { ClassModelWithIdAndImage } from '../../../shared/models/class.model';
import { UtilsService } from '../../../shared/services/utils.service';

import { CreateClassComponent } from '../../components/create-class/create-class.component';
import { DeleteClassComponent } from '../../components/delete-class/delete-class.component';
import { ModifyClassComponent } from '../../components/modify-class/modify-class.component';

@Component({
  selector: 'app-class-page',
  templateUrl: './class.page.html',
  styleUrls: ['./class.page.scss'],
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

  classes: ClassModelWithIdAndImage[] = [];

  selectedClass: ClassModelWithIdAndImage | null = null;

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

  openEdit(cls: ClassModelWithIdAndImage) {
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

  openDelete(cls: ClassModelWithIdAndImage) {
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

  trackById(index: number, item: ClassModelWithIdAndImage): string {
    return item.id;
  }
}
