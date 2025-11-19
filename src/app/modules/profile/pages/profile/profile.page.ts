import { Component, OnInit, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonAvatar, IonImg, IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { UserModel } from '../../../shared/models/user.model';
import { UtilsService } from '../../../shared/services/utils.service';
import { RoleEnum } from '../../../shared/enums/role.enum';
import { StateEnum } from '../../../shared/enums/state.enum';
import { AuthService } from '../../../auth/services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { COLLECTIONS } from '../../../shared/constants/firebase.constant';
import { addIcons } from 'ionicons';
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
  starOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonAvatar, IonImg, IonButtons,
    CommonModule
  ]
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private utilsService = inject(UtilsService);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  user: UserModel | null = null;
  loading = true;

  // Exponer los enums al template
  readonly StateEnum = StateEnum;

  constructor() {
    addIcons({
      pencil,
      person,
      personCircleOutline,
      calendarOutline,
      callOutline,
      mailOutline,
      cardOutline,
      calendarNumberOutline,
      timeOutline,
      starOutline
    });
  }

  async ngOnInit() {
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      // Obtener el usuario actual de Firebase Auth
      const firebaseUser = await this.getCurrentFirebaseUser();

      if (firebaseUser) {
        // Obtener los datos completos del usuario desde Firestore
        const userRef = doc(this.firestore, COLLECTIONS.USERS, firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.user = {
            ...userData,
            uid: userDoc.id
          } as UserModel;
          console.log('Usuario cargado:', this.user);
          console.log('PhotoURL:', this.user.photoURL);
        } else {
          console.error('No se encontraron datos del usuario en Firestore');
          this.utilsService.presentToast({
            message: 'No se encontró información del perfil',
            duration: 2500,
            color: 'warning'
          });
        }
      } else {
        console.error('No hay usuario autenticado');
        this.utilsService.presentToast({
          message: 'No hay usuario autenticado',
          duration: 2500,
          color: 'danger'
        });
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      this.utilsService.presentToast({
        message: 'Error al cargar el perfil',
        duration: 2500,
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  private getCurrentFirebaseUser(): Promise<any> {
    return new Promise((resolve) => {
      const subscription = this.authService.authState$.subscribe({
        next: (user) => {
          subscription.unsubscribe();
          console.log('Usuario Firebase:', user);
          resolve(user);
        },
        error: (error) => {
          subscription.unsubscribe();
          console.error('Error getting current user:', error);
          resolve(null);
        }
      });
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  // Métodos para la información de membresía
  getExpirationDate(): string {
    return '30/01/2025';
  }

  getPlanText(): string {
    return 'Básico';
  }

  getStateText(state: StateEnum | undefined): string {
    switch (state) {
      case StateEnum.ACTIVE: return 'Activa';
      case StateEnum.INACTIVE: return 'Inactiva';
      default: return 'No especificado';
    }
  }

  // MÉTODO AGREGADO PARA EL ROL
  getRoleText(role: RoleEnum | undefined): string {
    switch (role) {
      case RoleEnum.CLIENT: return 'Cliente';
      case RoleEnum.ADMIN: return 'Administrador';
      default: return 'Usuario';
    }
  }

  editProfile() {
    this.utilsService.presentToast({
      message: 'Funcionalidad de edición en desarrollo',
      duration: 2000,
      color: 'warning'
    });
  }
}
