import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {IonContent, IonRouterOutlet} from "@ionic/angular/standalone";

@Component({
  selector: 'app-background-layout',
  templateUrl: './background-layout.component.html',
  styleUrls: ['./background-layout.component.scss'],
  standalone: true,
  imports: [IonContent, RouterModule, IonRouterOutlet]
})
export class BackgroundLayoutComponent {
}
