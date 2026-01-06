import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonText,
  IonCardSubtitle
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  calendarOutline,
  checkmarkOutline,
  cashOutline,
  personAddOutline,
  barChartOutline,
  ticketOutline
} from 'ionicons/icons';
import { BannerComponent } from '../../components/banner/banner.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonIcon,
    IonItem,
    IonList,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonCardHeader,
    IonCard,
    IonCol,
    IonRow,
    IonGrid,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonLabel,
    CommonModule,
    FormsModule,
    BannerComponent
  ]
})
export class HomePage {
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({
      'people-outline': peopleOutline,
      'calendar-outline': calendarOutline,
      'checkmark-outline': checkmarkOutline,
      'cash-outline': cashOutline,
      'person-add-outline': personAddOutline,
      'bar-chart-outline': barChartOutline,
      'ticket-outline': ticketOutline
    });
  }

  // Método para navegar a diferentes secciones
  navigateTo(path: string) {
    // IMPORTANTE: Usar path relativo (sin slash) porque ya estamos dentro del layout
    this.navCtrl.navigateForward(path);
  }

  // ======================
  // MÉTODOS DE NAVEGACIÓN
  // ======================

  // CAMBIO: Navegar directamente a admin-browse
  goToReservationsPage() {
    this.navigateTo('reservations/admin-browse'); // <-- CAMBIO AQUÍ
  }

  goToCreateCustomer() {
    this.navigateTo('customers/new');
  }

  goToReports() {
    this.navigateTo('reports');
  }

  goToPayments() {
    this.navigateTo('plans');
  }

  goToCustomers() {
    this.navigateTo('customers');
  }

  goToClasses() {
    this.navigateTo('classes');
  }

  // Mantener este método para el item de "Reservas activas"
  // Si quieres que también vaya a admin-browse, cambia este también:
  goToReservations() {
    this.navigateTo('reservations/admin-browse'); // <-- CAMBIO TAMBIÉN AQUÍ
  }

  goToRevenue() {
    this.navigateTo('plans');
  }

  goToCreateClass() {
    this.navigateTo('classes/new');
  }
}
