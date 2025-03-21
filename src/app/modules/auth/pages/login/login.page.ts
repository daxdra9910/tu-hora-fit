import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonModal, IonImg, IonText } from '@ionic/angular/standalone';
import { filter, Subscription } from 'rxjs';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonList, IonItem, IonText, IonModal, IonButton, IonImg, CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('modal', { static: false }) modal!: IonModal;

  form: FormGroup;
  subscriptions = new Subscription();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  ngOnInit(): void {
    const routerSub = this.router.events
    .pipe(filter(event => event instanceof NavigationStart))
    .subscribe(() => {
      if (this.modal) {
        this.modal.dismiss();
      }
    });
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSubmit(): void {
    if (this.form.valid) {
      // TODO: Logica para hacer login.
      console.log('Login: ', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

}
