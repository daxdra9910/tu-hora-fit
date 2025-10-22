import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon, IonInput, IonItem, IonList,
  IonModal, IonSelect, IonSelectOption, IonText,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import {toggle} from "ionicons/icons";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UserService} from "../../../core/services/user.service";
import {UtilsService} from "../../../shared/services/utils.service";
import {NgIf} from "@angular/common";
import {StateEnum} from "../../../shared/enums/state.enum";
import {RoleEnum} from "../../../shared/enums/role.enum";

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonContent,
    IonInput,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
    NgIf,
    ReactiveFormsModule
  ]
})
export class CreateUserComponent  implements  OnInit {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly utilsService = inject(UtilsService);

  protected form!: FormGroup;
  protected possibleRoles = RoleEnum;
  protected possibleStates = StateEnum;

  ngOnInit() {
    this.setupForm();
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

  toggleOpen() {
    this.isOpenChange.emit();
  }

  onSubmit() {

  }
}
