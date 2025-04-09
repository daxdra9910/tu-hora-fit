import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonGrid,
  IonCol,
  IonRow,
  IonButton,
  IonIcon, IonList, IonItemSliding, IonItem, IonLabel, IonAvatar, IonImg, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import {UserService} from "../../../core/services/user.service";
import {UserModel} from "../../../shared/models/user.model";

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonGrid, IonCol, IonRow, IonButton, CommonModule, FormsModule, IonIcon, IonList, IonItemSliding, IonItem, IonLabel, IonAvatar, IonImg, IonItemOptions, IonItemOption]
})
export class CustomerPage implements OnInit {
  private readonly userService = inject(UserService);
  users: UserModel[];

  ngOnInit() {
    this.findUsers();
  }

  findUsers() {
    this.userService.getAllUsers().then(users => this.users = users);
  }

  searchTerm: string = '';
  constructor() { }
}
