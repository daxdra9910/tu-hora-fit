import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardContent,
  IonGrid, IonRow, IonCol, IonIcon, IonBadge
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

  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private scheduleService = inject(ScheduleService);
  private router = inject(Router);

  // Datos del usuario
  nombreUsuario = '';
  userEmail = '';

  // Reservas
  reservasPendientes = 0;

  // Calendario
  mesActual = '';
  anioActual = 0;
  mesActualNumero = 0;
  diasSemana: string[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  diasMes: (number | null)[] = [];
  diaSeleccionado: number | null = null;

  // Configuración de tiempo
  private readonly TZ = 'America/Bogota';
  private readonly LOCALE = 'es';

  ngOnInit(): void {
  this.inicializarCalendario();
}



  // =====================
  // USUARIO
  // =====================
  private async cargarDatosUsuario(): Promise<void> {
    return new Promise(resolve => {
      this.authService.authState$.subscribe((user: any) => {
        if (user) {
          this.nombreUsuario =
            user.displayName ||
            user.email?.split('@')[0] ||
            'Usuario';
          this.userEmail = user.email || '';
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
      if (!user?.uid) {
        this.reservasPendientes = 0;
        return;
      }

      const reservas = await this.reservationService
        .listUserActiveReservationsDetailed(user.uid);

      this.reservasPendientes = reservas?.length || 0;
    } catch {
      this.reservasPendientes = 0;
    }
  }

  private getCurrentUser(): Promise<any> {
    return new Promise(resolve => {
      this.authService.authState$.subscribe(user => resolve(user));
    });
  }

  // =====================
  // CALENDARIO
  // =====================
  private inicializarCalendario(): void {
    const ahora = DateTime.now()
      .setZone(this.TZ)
      .setLocale(this.LOCALE);

    this.mesActual = this.capitalizar(
      ahora.toFormat('LLLL yyyy')
    );
    this.anioActual = ahora.year;
    this.mesActualNumero = ahora.month;

    const primerDiaMes = DateTime.fromObject(
      { year: this.anioActual, month: this.mesActualNumero, day: 1 },
      { zone: this.TZ, locale: this.LOCALE }
    );

    const offset = primerDiaMes.weekday - 1;
    const totalDias = ahora.endOf('month').day;

    this.diasMes = [
      ...Array(offset).fill(null),
      ...Array.from({ length: totalDias }, (_, i) => i + 1)
    ];

    this.diaSeleccionado = ahora.day;
  }

  esHoy(dia: number | null): boolean {
    if (dia === null) return false;

    const hoy = DateTime.now().setZone(this.TZ);
    return (
      dia === hoy.day &&
      this.mesActualNumero === hoy.month &&
      this.anioActual === hoy.year
    );
  }

  esSeleccionado(dia: number | null): boolean {
    return dia !== null && dia === this.diaSeleccionado;
  }

  async seleccionarDia(dia: number | null): Promise<void> {
    if (dia === null) return;

    this.diaSeleccionado = dia;

    const fechaISO = DateTime.fromObject(
      {
        year: this.anioActual,
        month: this.mesActualNumero,
        day: dia
      },
      { zone: this.TZ }
    ).toISODate();

    this.router.navigate(['/reservations/browse'], {
      queryParams: {
        fecha: fechaISO,
        dia,
        mes: this.mesActualNumero,
        anio: this.anioActual
      }
    });
  }

  // =====================
  // NAVEGACIÓN
  // =====================
  goTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  irAClasesDelDia(): void {
    const hoy = DateTime.now().setZone(this.TZ);

    this.router.navigate(['/reservations/browse'], {
      queryParams: {
        fecha: hoy.toISODate(),
        dia: hoy.day,
        mes: hoy.month,
        anio: hoy.year
      }
    });
  }

  irAEnergIA(): void {
    this.router.navigate(['/chatbot']);
  }

  irAMisReservas(): void {
    this.router.navigate(['/reservations/mine']);
  }

  irACalendarioCompleto(): void {
    this.router.navigate(['/reservations/browse']);
  }

  obtenerSaludo(): string {
    const hora = DateTime.now().setZone(this.TZ).hour;
    if (hora < 12) return '¡Buenos días';
    if (hora < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  async recargarReservas(): Promise<void> {
    await this.cargarReservasPendientes();
  }

  // =====================
  // HELPERS
  // =====================
  private capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
