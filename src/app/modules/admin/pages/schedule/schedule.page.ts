import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { CreateScheduleComponent } from "../../components/create-schedule/create-schedule.component";
import { ScheduleService } from 'src/app/modules/core/services/schedule.service';
import { ScheduleClassModelWithId } from 'src/app/modules/shared/models/schedule-class.model';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [IonText, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CreateScheduleComponent]
})
export class SchedulePage implements OnInit {
  private readonly scheduleService = inject(ScheduleService);

  schedules: ScheduleClassModelWithId[] = [];

  isCreating = false;

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.scheduleService.getAllSchedules()
    .then(schedules => {
      this.schedules = schedules;
    })
  }

  openCreate(): void {
    this.isCreating = true;
  }

  closeCreate(): void {
    this.isCreating = false;
  }

}
