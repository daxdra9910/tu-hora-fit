import {CommonModule} from '@angular/common';
import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NavigationStart, Router, RouterModule} from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonImg,
  IonText,
  NavController, IonInputPasswordToggle
} from '@ionic/angular/standalone';
import {filter, Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {UtilsService} from 'src/app/modules/shared/services/utils.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonList, IonItem, IonText, IonModal, IonButton, IonImg, CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly utilsService = inject(UtilsService);
  private readonly navCtrl = inject(NavController)

  @ViewChild('modal', {static: false}) modal!: IonModal;

  form!: FormGroup;
  subscriptions = new Subscription();

  ngOnInit(): void {
    this.setupForm();
    this.subscribeRouterEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  subscribeRouterEvents(): void {
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(async () => {
        if (this.modal) {
          await this.modal.dismiss();
        }
      });
    this.subscriptions.add(routerSub);
  }

  async onSubmit() {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      this.authService.singIn(this.form.value['email'], this.form.value['password'])
        .then(() => this.navCtrl.navigateForward('/home'))
        .catch(error => this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        }))
        .finally(() => loading.dismiss());
    } else {
      this.form.markAllAsTouched();
    }
  }

}
