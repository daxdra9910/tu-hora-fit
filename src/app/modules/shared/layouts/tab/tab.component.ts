import {Component, inject} from '@angular/core';
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
  MenuController,
  NavController
} from '@ionic/angular/standalone';
import {AuthService} from 'src/app/modules/auth/services/auth.service';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs, IonMenu, IonHeader, IonToolbar, IonContent, IonTitle, IonButton],
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

  async openOptionsMenu() {
    await this.menuCtrl.open('optionsMenu');
  }
}
