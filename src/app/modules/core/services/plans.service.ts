import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { PlanCreateDTO, PlanModel, PlanUpdateDTO } from '../../shared/models/plan.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private readonly firestore = inject(Firestore);
  private readonly collName = COLLECTIONS.PLANS; // p.ej. 'plans'

  /** Ref tipada a la colección */
  private colRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collName);
  }

  /** Crear plan (genera ID y setea auditoría) */
  async createPlan(data: PlanCreateDTO): Promise<string> {
    const ref = doc(this.colRef()); // genera ID
    await setDoc(ref, {
      name: data.name,
      creditsTotal: Number(data.creditsTotal),
      price: Number(data.price),
      description: data.description ?? '',
      state: data.state,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Obtener un plan por id */
  async getPlan(id: string): Promise<PlanModel | null> {
    const ref = doc(this.firestore, `${this.collName}/${id}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return this.mapDoc(snap.id, snap.data());
  }

  /** Listar todos los planes (más nuevos primero) */
  async getAllPlans(): Promise<PlanModel[]> {
    const q = query(this.colRef(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.mapDoc(d.id, d.data()));
  }

  // -------- UPDATE (sobrecargas) --------
  async updatePlan(id: string, data: PlanUpdateDTO): Promise<void>;
  async updatePlan(plan: PlanModel): Promise<void>;
  async updatePlan(idOrPlan: string | PlanModel, data?: PlanUpdateDTO): Promise<void> {
    const id = typeof idOrPlan === 'string' ? idOrPlan : idOrPlan.id;
    const patchSrc = typeof idOrPlan === 'string' ? (data ?? {}) : (idOrPlan as Partial<PlanModel>);
    const patch: any = { updatedAt: serverTimestamp() };

    if (patchSrc.name !== undefined)          patch.name = patchSrc.name;
    if (patchSrc.creditsTotal !== undefined)  patch.creditsTotal = Number(patchSrc.creditsTotal);
    if (patchSrc.price !== undefined)         patch.price = Number(patchSrc.price);
    if (patchSrc.description !== undefined)   patch.description = patchSrc.description ?? '';
    if ((patchSrc as any).state !== undefined) patch.state = (patchSrc as any).state;

    const ref = doc(this.firestore, `${this.collName}/${id}`);
    await updateDoc(ref, patch);
  }

  // -------- DELETE (sobrecarga) --------
  async deletePlan(id: string): Promise<void>;
  async deletePlan(plan: PlanModel): Promise<void>;
  async deletePlan(idOrPlan: string | PlanModel): Promise<void> {
    const id = typeof idOrPlan === 'string' ? idOrPlan : idOrPlan.id;
    const ref = doc(this.firestore, `${this.collName}/${id}`);
    await deleteDoc(ref);
  }

  /** Mapea documento Firestore → PlanModel
   *  Compatibilidad: si existe `duration` (modelo viejo), lo usa como `creditsTotal`.
   */
  private mapDoc(id: string, raw: any): PlanModel {
    return {
      id,
      name: raw?.name ?? '',
      creditsTotal: typeof raw?.creditsTotal === 'number'
        ? raw.creditsTotal
        : Number(raw?.duration ?? 1),
      price: Number(raw?.price ?? 0),
      description: raw?.description ?? '',
      state: raw?.state,
      createdAt: raw?.createdAt ?? null,
      updatedAt: raw?.updatedAt ?? null,
      // si tu AuditModel incluye estos campos, los dejamos en null si no existen
      ...(raw?.createdBy !== undefined ? { createdBy: raw.createdBy } : { createdBy: null }),
      ...(raw?.updatedBy !== undefined ? { updatedBy: raw.updatedBy } : { updatedBy: null }),
    } as PlanModel;
  }
}
