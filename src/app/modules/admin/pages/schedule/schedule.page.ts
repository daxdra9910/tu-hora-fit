import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonText, IonModal } from '@ionic/angular/standalone';
import { CreateScheduleComponent } from "../../components/create-schedule/create-schedule.component";

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [IonModal, IonText, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CreateScheduleComponent]
})
export class SchedulePage implements OnInit {

  isCreating = false;

  ngOnInit(): void {
  }

  openCreate(): void {
    this.isCreating = true;
  }

  closeCreate(): void {
    this.isCreating = false;
  }

}
