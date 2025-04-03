import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonModal, IonImg, IonText } from '@ionic/angular/standalone';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/modules/core/services/utils.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonList, IonItem, IonText, IonModal, IonButton, IonImg, CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('modal', { static: false }) modal!: IonModal;

  form!: FormGroup;
  subscriptions = new Subscription();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly utilsService: UtilsService
  ) {}

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
    .subscribe(() => {
      if (this.modal) {
        this.modal.dismiss();
      }
    });
    this.subscriptions.add(routerSub);
  }

  async onSubmit() {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();
      
      this.authService.singIn(this.form.value['email'], this.form.value['password'])
      .then(user => console.log(user))
      .catch(error => this.utilsService.presentToast({
        message: error.message,
        duration: 2500,
        color: 'green',
        position: 'middle',
        icon: 'alert-circle-outline'
      }))
      .finally(() => loading.dismiss());  
    } else {
      this.form.markAllAsTouched();
    }
  }

}
