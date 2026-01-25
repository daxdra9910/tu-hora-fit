import { Component, OnInit, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonAvatar, IonImg, IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { UtilsService } from '../../../shared/services/utils.service';
import { RoleEnum } from '../../../shared/enums/role.enum';
import { StateEnum } from '../../../shared/enums/state.enum';
import { AuthService } from '../../../auth/services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { COLLECTIONS } from '../../../shared/constants/firebase.constant';
import { CreditsService, UserCredits } from '../../../core/services/credits.service';
import { addIcons } from 'ionicons';
import { ModalController } from '@ionic/angular/standalone';
import { EditProfileModalPage } from '../edit-profile-modal/edit-profile-modal.page';


import {
  pencil,
  person,
  personCircleOutline,
  calendarOutline,
  callOutline,
  mailOutline,
  cardOutline,
  calendarNumberOutline,
  timeOutline,
  starOutline, personOutline } from 'ionicons/icons';
import { UserModel } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonAvatar,IonButtons,
    CommonModule, IonImg,
  ]
})
export class ProfilePage implements OnInit {

  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private utilsService = inject(UtilsService);
  private creditsService = inject(CreditsService);
  private modalCtrl = inject(ModalController);



  user: UserModel | null = null;
  userCredits: UserCredits | null = null;
  loading = true;

  // enums para template
  readonly StateEnum = StateEnum;

  constructor() {
    addIcons({pencil,person,personCircleOutline,calendarOutline,callOutline,mailOutline,cardOutline,calendarNumberOutline,timeOutline,starOutline,personOutline});
  }

  async ngOnInit() {
    await this.loadUserProfile();
  }




  async loadUserProfile() {
    try {
      const firebaseUser = await this.getCurrentFirebaseUser();

      if (!firebaseUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Datos del usuario
      const userRef = doc(this.firestore, COLLECTIONS.USERS, firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      this.user = {
        ...userDoc.data(),
        uid: userDoc.id
      } as UserModel;


      // Créditos / Membresía (puede ser null y está bien)
      this.userCredits = await this.creditsService.getUserCredits(firebaseUser.uid);

    } catch (error) {
      console.error('Error loading profile:', error);
      this.utilsService.presentToast({
        message: 'Error al cargar el perfil',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  private getCurrentFirebaseUser(): Promise<any> {
    return new Promise(resolve => {
      const sub = this.authService.authState$.subscribe(user => {
        sub.unsubscribe();
        resolve(user);
      });
    });
  }

  // =====================
  // HELPERS MEMBRESÍA
  // =====================

  getExpirationDate(): string {
    if (!this.userCredits?.planExpiryDate) return '—';
    return this.userCredits.planExpiryDate.toLocaleDateString('es-ES');
  }

  getPlanText(): string {
    return this.userCredits?.planName || 'Sin plan activo';
  }

  getMembershipState(): { text: string; css: string } {
    if (!this.userCredits) {
      return { text: 'Sin plan', css: 'inactive' };
    }

    if (this.userCredits.isExpired) {
      return { text: 'Expirada', css: 'inactive' };
    }

    return { text: 'Activa', css: 'active' };
  }

  // =====================
  // OTROS HELPERS
  // =====================

  getRoleText(role?: RoleEnum): string {
    switch (role) {
      case RoleEnum.ADMIN: return 'Administrador';
      case RoleEnum.CLIENT: return 'Cliente';
      default: return 'Usuario';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';

    const [year, month, day] = dateString.split('-');

    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return `${Number(day)} ${meses[Number(month) - 1]} ${year}`;
  }


  async editProfile() {
    if (!this.user) return;

    const modal = await this.modalCtrl.create({
      component: EditProfileModalPage,
      componentProps: {
        user: this.user
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.updated && data.user) {
      this.user = data.user;

      this.utilsService.presentToast({
        message: 'Perfil actualizado',
        duration: 2000,
        color: 'success'
      });
    }
  }

}
