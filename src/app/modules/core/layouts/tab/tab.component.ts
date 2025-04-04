import { Component, inject, OnInit } from '@angular/core';
import { IonIcon, IonTabBar, IonTabButton, IonTabs, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonRouterOutlet, MenuController, NavController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs, IonMenu, IonHeader, IonToolbar, IonContent, IonTitle, IonButton, IonRouterOutlet,],
})
export class TabComponent {
  private readonly menuCtrl = inject(MenuController);
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);

  onLogout(){
    this.authService.logout().then(() => {
      this.menuCtrl.close('optionsMenu');
      this.navCtrl.navigateBack('/auth/login');
    });
  }

  openOptionsMenu() {
    this.menuCtrl.open('optionsMenu');
  }
}
