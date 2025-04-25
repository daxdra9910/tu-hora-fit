import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { PlanModel } from '../../shared/models/plan.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private readonly firestore = inject(Firestore);

  createPlan(plan: PlanModel): Promise<void> {
    const planRef = doc(this.firestore, COLLECTIONS.PLANS, plan.id);
    return setDoc(planRef, plan);
  }

  async getAllPlans(): Promise<PlanModel[]> {
    const plansRef = collection(this.firestore, COLLECTIONS.PLANS);
    const snapshot = await getDocs(plansRef);

    return snapshot.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id
      } as PlanModel;
    });
  }

  updatePlan(plan: PlanModel): Promise<void> {
    const planRef = doc(this.firestore, COLLECTIONS.PLANS, plan.id);
    const { id, ...planData } = plan;
    return updateDoc(planRef, planData);
  }

  deletePlan(plan: PlanModel): Promise<void> {
    const planRef = doc(this.firestore, COLLECTIONS.PLANS, plan.id);
    return deleteDoc(planRef);
  }
}
