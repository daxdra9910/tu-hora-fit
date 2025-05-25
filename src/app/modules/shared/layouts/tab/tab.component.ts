import {Component, inject} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenu, IonNavLink,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  MenuController,
  NavController
} from '@ionic/angular/standalone';
import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs, IonMenu, IonHeader, IonToolbar, IonContent, IonTitle, IonButton, IonNavLink, RouterLink],
})
export class TabComponent {
  private readonly menuCtrl = inject(MenuController);
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);

  onLogout() {
    this.authService.logout().then(async () => {
      await this.menuCtrl.close('optionsMenu');
      await this.navCtrl.navigateBack('/auth/login');
    });
  }

  navigateTo(path: string) {
    this.navCtrl.navigateForward(path);
    this.menuCtrl.close('optionsMenu');
  }

  async openOptionsMenu() {
    await this.menuCtrl.open('optionsMenu');
  }
}
