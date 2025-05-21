import { Component, OnInit, inject } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts'; // solo se importa, no se modifica

import { CommonModule } from '@angular/common'; // necesario para *ngIf y *ngFor

import { InventoryService } from '../../../core/services/inventory.service';
import { Inventory } from '../../../shared/models/inventory.model';
import { UtilsService } from '../../../shared/services/utils.service';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [IonIcon,
    CommonModule, // <--- necesario para *ngIf y *ngFor
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonButton,
    IonIcon
  ]
})
export class InventoryPage implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);

  inventories: Inventory[] = [];

  ngOnInit() {
    this.loadInventories();
  }

  async loadInventories() {
    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const data = await this.inventoryService.getAllInventories();
      this.inventories = data;
    } catch (error: any) {
      this.utilsService.presentToast({
        message: error.message || 'Error al cargar inventario',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  exportToPDF() {
    const today = new Date();
    const fecha = today.toLocaleDateString();

    const docDefinition = {
      content: [
        {
          text: 'REPORTE DE INVENTARIO',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: `Fecha de generación: ${fecha}`,
          alignment: 'right',
          margin: [0, 0, 0, 20],
          fontSize: 10
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Nombre del Equipo', style: 'tableHeader' }, { text: 'Cantidad', style: 'tableHeader' }],
              ...this.inventories.map(item => [item.name, item.quantity])
            ]
          }
        },
        {
          text: `\nTotal de elementos: ${this.inventories.length}`,
          alignment: 'right',
          bold: true,
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          fillColor: '#00FF87', // Verde neón de tu paleta
          color: '#000'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download('reporte_inventario.pdf');
  }
}

