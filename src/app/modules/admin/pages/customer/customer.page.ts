import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonAvatar,
  IonButton,
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

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonButton, CommonModule, FormsModule, IonIcon, IonList, IonItemSliding, IonItem, IonAvatar, IonImg, IonItemOptions, IonItemOption, IonText, IonGrid, IonRow, IonCol, IonChip, StatePipe]
})
export class CustomerPage implements OnInit {
  private readonly userService = inject(UserService);

  users: UserModel[];

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
}
