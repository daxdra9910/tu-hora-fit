import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc, query, orderBy, startAt, endAt, getDoc
} from '@angular/fire/firestore';
import { PlanModel } from '../../shared/models/plan.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private readonly firestore = inject(Firestore);

  createPlan(plan: PlanModel): Promise<void> {
    const newId = doc(collection(this.firestore, COLLECTIONS.PLANS)).id;
    const planRef = doc(this.firestore, COLLECTIONS.PLANS, newId);
    return setDoc(planRef, plan);
  }

  async searchPlans(search: string) : Promise<PlanModel[]> {
    if (!search.trim()) {
      return this.getAllPlans();
    }

    const plansRef = collection(this.firestore, COLLECTIONS.PLANS);

    const nameQuery = query(
      plansRef,
      orderBy('name'),
      startAt(search),
      endAt(search + '\uf8ff')
    );

    const docs = await getDocs(nameQuery);
    return docs.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id
      } as PlanModel;
    });
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
