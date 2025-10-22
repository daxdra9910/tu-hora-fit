import { Component, OnInit } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg } from "@ionic/angular/standalone";

@Component({
  selector: 'app-banner',
  imports: [IonCardSubtitle, IonCardTitle, IonCardHeader, IonCard, IonImg],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
