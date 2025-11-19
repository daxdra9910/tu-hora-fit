import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardContent,
  IonGrid, IonRow, IonCol, IonIcon, IonBadge, IonButton // ← Agregar IonButton aquí
} from '@ionic/angular/standalone';
import { BannerComponent } from '../../components/banner/banner.component';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { ReservationService } from '../../../core/services/reservations.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-home-client',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardContent,
    IonGrid, IonRow, IonCol, IonIcon, IonBadge,
    BannerComponent
  ]
})
export class HomeClientPage implements OnInit {
  // ... el resto de tu código se mantiene igual ...
  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private scheduleService = inject(ScheduleService);
  private router = inject(Router);

  // Datos del usuario
  nombreUsuario: string = '';
  userEmail: string = '';

  // Reservas
  reservasPendientes: number = 0;

  // Calendario
  mesActual: string = '';
  anioActual: number = 0;
  mesActualNumero: number = 0;
  diasSemana: string[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  diasMes: number[] = [];
  diaSeleccionado: number | null = null;

  // Configuración de tiempo
  private readonly TZ = 'America/Bogota';
  private readonly LOCALE = 'es';

  async ngOnInit() {
    await this.cargarDatosUsuario();
    await this.cargarReservasPendientes();
    this.inicializarCalendario();
  }

  // ... el resto de tus métodos se mantiene igual ...
  private async cargarDatosUsuario(): Promise<void> {
    return new Promise((resolve) => {
      this.authService.authState$.subscribe((user: any) => {
        if (user) {
          this.nombreUsuario = user.displayName ||
                              user.email?.split('@')[0] ||
                              'Usuario';
          this.userEmail = user.email || '';
          console.log('Usuario cargado:', this.nombreUsuario, this.userEmail);
        } else {
          this.nombreUsuario = 'Invitado';
          this.userEmail = '';
        }
        resolve();
      });
    });
  }

  private async cargarReservasPendientes(): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      if (user && user.uid) {
        console.log('Cargando reservas para usuario:', user.uid);

        const reservasDetalladas = await this.reservationService.listUserActiveReservationsDetailed(user.uid);
        this.reservasPendientes = reservasDetalladas?.length || 0;

        console.log('Reservas encontradas:', reservasDetalladas);
        console.log('Total reservas pendientes:', this.reservasPendientes);
      } else {
        console.log('No hay usuario autenticado');
        this.reservasPendientes = 0;
      }
    } catch (error) {
      console.error('Error cargando reservas pendientes:', error);
      this.reservasPendientes = 0;
    }
  }

  private getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      this.authService.authState$.subscribe((user: any) => {
        resolve(user);
      });
    });
  }

  private inicializarCalendario(): void {
    const ahora = DateTime.now().setZone(this.TZ).setLocale(this.LOCALE);
    this.mesActual = ahora.toFormat('LLLL yyyy');
    this.anioActual = ahora.year;
    this.mesActualNumero = ahora.month;

    const ultimoDia = ahora.endOf('month');
    const totalDias = ultimoDia.day;

    this.diasMes = Array.from({ length: totalDias }, (_, i) => i + 1);
    this.diaSeleccionado = ahora.day;

    console.log('Calendario inicializado:', {
      mes: this.mesActual,
      totalDias: totalDias,
      diaSeleccionado: this.diaSeleccionado
    });
  }

  esHoy(dia: number): boolean {
    const hoy = DateTime.now().setZone(this.TZ).setLocale(this.LOCALE);
    return dia === hoy.day &&
           this.mesActualNumero === hoy.month &&
           this.anioActual === hoy.year;
  }

  esSeleccionado(dia: number): boolean {
    return dia === this.diaSeleccionado;
  }

  async seleccionarDia(dia: number): Promise<void> {
    this.diaSeleccionado = dia;

    const fechaSeleccionada = DateTime.fromObject({
      year: this.anioActual,
      month: this.mesActualNumero,
      day: dia
    }, { zone: this.TZ, locale: this.LOCALE });

    const fechaISO = fechaSeleccionada.toISODate();

    console.log('Navegando a clases del día:', {
      dia: dia,
      fecha: fechaISO,
      mes: this.mesActual,
      anio: this.anioActual
    });

    this.router.navigate(['/reservations/browse'], {
      queryParams: {
        fecha: fechaISO,
        dia: dia,
        mes: this.mesActualNumero,
        anio: this.anioActual
      }
    });
  }

  goTo(path: string): void {
    console.log('Navegando a:', path);
    this.router.navigateByUrl(path);
  }

  irAClasesDelDia(): void {
    const hoy = DateTime.now().setZone(this.TZ).setLocale(this.LOCALE);
    const fechaHoy = hoy.toISODate();

    console.log('Navegando a clases de hoy:', fechaHoy);

    this.router.navigate(['/reservations/browse'], {
      queryParams: {
        fecha: fechaHoy,
        dia: hoy.day,
        mes: hoy.month,
        anio: hoy.year
      }
    });
  }

  irAEnergIA(): void {
    console.log('Abriendo chatbot de EnergIA');
    this.router.navigate(['/chatbot']);
  }

  irAMisReservas(): void {
    console.log('Navegando a mis reservas');
    this.router.navigate(['/reservations/mine']);
  }

  irACalendarioCompleto(): void {
    console.log('Navegando a calendario completo');
    this.router.navigate(['/reservations/browse']);
  }

  obtenerSaludo(): string {
    const hora = DateTime.now().setZone(this.TZ).hour;

    if (hora >= 5 && hora < 12) {
      return '¡Buenos días';
    } else if (hora >= 12 && hora < 18) {
      return '¡Buenas tardes';
    } else {
      return '¡Buenas noches';
    }
  }

  async recargarReservas(): Promise<void> {
    console.log('Recargando reservas manualmente...');
    await this.cargarReservasPendientes();
  }
}
