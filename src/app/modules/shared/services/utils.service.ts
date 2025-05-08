import {Injectable} from '@angular/core';
import {LoadingController, ToastController, ToastOptions} from '@ionic/angular'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
  ) {
  }

  loading() {
    return this.loadingCtrl.create({spinner: 'crescent'});
  }

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    await toast.present();
  }
}
