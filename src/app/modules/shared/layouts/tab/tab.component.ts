import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenu,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonMenuToggle,
  MenuController,
  NavController
} from '@ionic/angular/standalone';
import { NgIf, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { switchMap, of } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { ViewChild } from '@angular/core';




@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [
    // Ionic
    IonIcon, IonTabBar, IonTabButton, IonTabs,
    IonMenu, IonHeader, IonToolbar, IonContent, IonTitle, IonButton,
    IonList, IonItem, IonLabel, IonMenuToggle,
    // Angular
    NgIf, AsyncPipe
  ],
})
export class TabComponent {
  private readonly menuCtrl = inject(MenuController);
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly router = inject(Router);
  private readonly firestore = inject(Firestore);

  user$ = this.authService.authState$.pipe(
  switchMap(user => {
    if (!user) return of(null);
    const ref = doc(this.firestore, 'users', user.uid);
    return docData(ref, { idField: 'uid' });
  })
);


  get isAdmin(): boolean  { return this.authService.hasRole('admin'); }
  get isClient(): boolean { return this.authService.hasRole('client'); }

  getUserInitial(user: any): string {
    const source =
      user?.displayName ||
      user?.name ||
      user?.email ||
      '';

    if (!source) return 'U';

    return source.trim().charAt(0).toUpperCase();
  }

  // Navegación para CLIENTES
  navigateClient(path: string) {
    switch(path) {
      case 'home':
        if (this.isClient) this.navCtrl.navigateRoot('/home/client');
        break;
      case 'reservations':
        if (this.isClient) this.navCtrl.navigateRoot('/reservations/mine');
        break;
      case 'notifications':
        if (this.isClient) this.navCtrl.navigateRoot('/notifications/mine');
        break;
    }
  }

  // Navegación para ADMINISTRADORES
  navigateAdmin(path: string) {
    switch(path) {
      case 'home':
        this.navCtrl.navigateRoot('/home');
        break;
      case 'users':
        this.navCtrl.navigateRoot('/admin/customers');
        break;
      case 'schedule':
        this.navCtrl.navigateRoot('/admin/schedule');
        break;
      case 'payments':
        this.navCtrl.navigateRoot('/admin/plans');
        break;
    }
  }



  // Verificar ruta activa para CLIENTE
  isActiveClient(path: string): boolean {
    if (!this.isClient) return false;

    const currentUrl = this.router.url.split('?')[0];
    const clientRoutes: Record<string, string[]> = {
      'home': ['/home/client'],
      'reservations': ['/reservations/mine'],
      'notifications': ['/notifications/mine']
    };

    if (clientRoutes[path]) {
      return clientRoutes[path].some(route =>
        currentUrl === route || currentUrl.startsWith(route + '/')
      );
    }

    return false;
  }

  // Verificar ruta activa para ADMIN
  isActiveAdmin(path: string): boolean {
    if (!this.isAdmin) return false;

    const currentUrl = this.router.url.split('?')[0];
    const adminRoutes: Record<string, string[]> = {
      'home': ['/home'],
      'users': ['/admin/customers'],
      'schedule': ['/admin/schedule'],
      'payments': ['/admin/plans']
    };

    if (adminRoutes[path]) {
      return adminRoutes[path].some(route =>
        currentUrl === route || currentUrl.startsWith(route + '/')
      );
    }

    return false;
  }

  // Para menú lateral
  isActivePrefix(prefix: string): boolean {
    const url = (this.router.url || '').split('?')[0];
    return url === prefix || url.startsWith(prefix + '/');
  }

  async onLogout() {
    await this.authService.logout();
    await this.menuCtrl.close('optionsMenu');
    await this.navCtrl.navigateRoot('/auth/login');

  }

  navigateTo(path: string) {
    this.navCtrl.navigateForward(path);
    this.menuCtrl.close('optionsMenu');
  }

  async openOptionsMenu() {
    await this.menuCtrl.open('optionsMenu');
  }

  ionViewWillEnter() {
  const url = this.router.url;

  // ⛔ Si ya estás en home o subrutas, no hagas nada
  if (url.startsWith('/home')) {
    return;
  }

  // ✅ Forzar home correcto según rol
  if (this.isAdmin) {
    this.navCtrl.navigateRoot('/home');
  } else if (this.isClient) {
    this.navCtrl.navigateRoot('/home/client');
  }
}
}
