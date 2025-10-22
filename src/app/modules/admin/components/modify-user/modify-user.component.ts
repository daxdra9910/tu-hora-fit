import {Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import {UserModel} from "../../../shared/models/user.model";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {RoleEnum} from "../../../shared/enums/role.enum";
import {StateEnum} from "../../../shared/enums/state.enum";
import {UserService} from "../../../core/services/user.service";
import {UtilsService} from "../../../shared/services/utils.service";

@Component({
  selector: 'app-modify-user',
  templateUrl: './modify-user.component.html',
  styleUrls: ['./modify-user.component.scss'],
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonList,
    IonItem,
    IonInput,
    FormsModule,
    IonText,
    NgIf,
    ReactiveFormsModule,
    IonSelect,
    IonSelectOption
  ]
})
export class ModifyUserComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() user: UserModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly utilsService = inject(UtilsService);

  form!: FormGroup;

  possibleRoles = RoleEnum;
  possibleStates = StateEnum;

  ngOnInit() {
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user && this.form) {
      this.form.patchValue({
        name: this.user.displayName|| '',
        email: this.user.email || '',
        phone: this.user.phoneNumber || '',
        birthdate: this.user.birthdate || '',
        role: this.user.role || '',
        state: this.user.state || ''
      });
    }
  }

  toggleOpen() {
    this.isOpenChange.emit();
  }

  setupForm() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      birthdate: ['', [Validators.required]],
      role: ['', [Validators.required]],
      state: ['', [Validators.required]]
    })
  }

  async onSubmit() {
    if(this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user: UserModel = {
      ...this.user,
      displayName: this.form.value.name,
      phoneNumber: this.form.value.phone,
      birthdate: this.form.value.birthdate,
      role: this.form.value.role,
      state: this.form.value.state
    };

    const loading = await this.utilsService.loading();
    await loading.present();

    this.userService.updateUser(user)
      .then(async () => {
        await this.utilsService.presentToast({
          message: "Usuario actualizado correctamente",
          duration: 2500,
          position: "bottom",
          color: "success",
          icon: "checkmark-circle"
        })
        this.toggleOpen();
      })
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        })
      })
      .finally(() => loading.dismiss());
  }

}
