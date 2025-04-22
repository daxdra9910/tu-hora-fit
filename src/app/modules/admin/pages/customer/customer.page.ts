import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonRow,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {UserService} from "../../../core/services/user.service";
import {UserModel} from "../../../shared/models/user.model";
import {StatePipe} from "../../../shared/pipes/state.pipe";
import {StateEnum} from "../../../shared/enums/state.enum";
import {ModifyUserComponent} from "../../components/modify-user/modify-user.component";
import {DeleteUserComponent} from "../../components/delete-user/delete-user.component";
import {CreateUserComponent} from "../../components/create-user/create-user.component";

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonButton, CommonModule, FormsModule, IonIcon, IonList, IonItemSliding, IonItem, IonAvatar, IonImg, IonItemOptions, IonItemOption, IonText, IonGrid, IonRow, IonCol, IonChip, StatePipe, IonButtons, ModifyUserComponent, IonAlert, DeleteUserComponent, CreateUserComponent]
})
export class CustomerPage implements OnInit {
  private readonly userService = inject(UserService);

  @ViewChild('userList') userList!: IonList;

  users: UserModel[];
  isCreating = false;
  isEditing = false;
  isDeleting = false;
  selectedUser: UserModel;

  activeState = StateEnum.ACTIVE;

  ngOnInit() {
    this.filterUsers();
  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value;
    this.filterUsers(query);
  }

  filterUsers(search: string = '') {
    this.userService.searchUsers(search).then(users => this.users = users);
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
  }

  openEdit(user: UserModel) {
    this.userList?.closeSlidingItems().then(() => {
      this.selectedUser = user;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.filterUsers();
  }

  openDelete(user: UserModel) {
    this.userList?.closeSlidingItems().then(() => {
      this.selectedUser = user;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.filterUsers();
  }
}
