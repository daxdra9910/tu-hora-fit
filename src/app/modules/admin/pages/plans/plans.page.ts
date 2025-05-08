import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonRow,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar,
  SearchbarInputEventDetail
} from '@ionic/angular/standalone';
import {IonSearchbarCustomEvent} from '@ionic/core';

import {CreatePlanComponent} from '../../components/create-plan/create-plan.component';
import {ModifyPlanComponent} from '../../components/modify-plan/modify-plan.component';
import {DeletePlanComponent} from '../../components/delete-plan/delete-plan.component';
import {PlanModel} from "../../../shared/models/plan.model";
import {StateEnum} from "../../../shared/enums/state.enum";
import {StatePipe} from "../../../shared/pipes/state.pipe";
import {PlansService} from "../../../core/services/plans.service";
import {UtilsService} from "../../../shared/services/utils.service";

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
  standalone: true,
  imports: [IonChip, CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItemSliding,
    IonSearchbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonText,
    IonList,
    IonItemOptions,
    IonItemOption,
    IonItem,
    CreatePlanComponent,
    ModifyPlanComponent,
    DeletePlanComponent, IonCol, IonGrid, IonRow, StatePipe
  ]
})
export class PlansPage implements OnInit {
  private readonly plansService = inject(PlansService);
  private readonly utilsService = inject(UtilsService);

  @ViewChild('planList') planList!: IonList;

  plans: PlanModel[] = [];
  selectedPlan: PlanModel | null = null;

  isCreating = false;
  isEditing = false;
  isDeleting = false;

  aciveState = StateEnum.ACTIVE;

  ngOnInit() {
    this.getPlans();
  }

  async getPlans(name: string = '') {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.plansService.searchPlans(name)
      .then(plans => this.plans = plans)
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value;
    this.getPlans(query);
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
    this.getPlans();
  }

  openEdit(plan: PlanModel) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.selectedPlan = null;
    this.getPlans();
  }

  openDelete(plan: PlanModel) {
    this.planList?.closeSlidingItems().then(() => {
      this.selectedPlan = plan;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.selectedPlan = null;
    this.getPlans();
  }
}
