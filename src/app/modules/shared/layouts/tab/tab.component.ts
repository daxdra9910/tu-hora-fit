// src/app/modules/shared/layouts/tab/tab.component.ts
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
  NavController,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { NgIf, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

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

  /** Usuario (para foto/nombre en el header) */
  user$ = this.authService.authState$;

  /** Rol (usa helpers del AuthService) */
  get isAdmin(): boolean  { return this.authService.hasRole('admin'); }
  get isClient(): boolean { return this.authService.hasRole('client'); }

  /** Marca activo comparando por prefijo (tolerante a subrutas y querystrings) */
  isActivePrefix(prefix: string): boolean {
    const url = (this.router.url || '').split('?')[0];
    return url === prefix || url.startsWith(prefix + '/');
  }

  async onLogout() {
    await this.authService.logout();
    await this.menuCtrl.close('optionsMenu');
    await this.navCtrl.navigateBack('/auth/login');
  }

  navigateTo(path: string) {
    this.navCtrl.navigateForward(path);
    this.menuCtrl.close('optionsMenu');
  }

  async openOptionsMenu() {
    await this.menuCtrl.open('optionsMenu');
  }
}