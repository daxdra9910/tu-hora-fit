import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {IonAlert} from "@ionic/angular/standalone";
import {UserModel} from "../../../shared/models/user.model";
import {UserService} from "../../../core/services/user.service";
import {UtilsService} from "../../../shared/services/utils.service";

@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.scss'],
  imports: [
    IonAlert
  ]
})
export class DeleteUserComponent {
  private readonly usersService = inject(UserService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Input() user: UserModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: async () => await this.delete()
    }
  ];

  toggleOpen() {
    this.isOpenChange.emit();
  }

  async delete() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.usersService.deleteUser(this.user)
      .then(async () => {
        await this.utilsService.presentToast({
          message: "Usuario eliminado correctamente",
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

  get message (): string {
    if(this.user) {
      return `¿Estás seguro que desea eliminar el usuario de ${this.user.displayName}?`;
    }
    return '';
  }
}
