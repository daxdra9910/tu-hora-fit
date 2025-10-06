import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonList, IonItem, IonIcon, IonLabel, IonText } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { BannerComponent } from '../../components/banner/banner.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonText, IonLabel, IonIcon, IonItem, IonList, IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonCol, IonRow, IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, BannerComponent]
})
export class HomePage {
}
