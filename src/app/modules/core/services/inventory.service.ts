import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Inventory } from '../../shared/models/inventory.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly firestore = inject(Firestore);

  createInventory(inventory: Inventory) {
    const inventoryRef = doc(collection(this.firestore, COLLECTIONS.INVENTORIES));
    return setDoc(inventoryRef, inventory);
  }

  async getAllInventories(): Promise<Inventory[]> {
    const inventoriesRef = collection(this.firestore, COLLECTIONS.INVENTORIES);
    const snapshot = await getDocs(inventoriesRef);

    return snapshot.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id
      } as Inventory;
    });
  }

  async updateInventory(inventory: Inventory): Promise<void> {
    const inventoryRef = doc(this.firestore, COLLECTIONS.INVENTORIES, inventory.id!);
    const { id, ...inventoryData } = inventory; // quitamos el id para no duplicarlo
    await updateDoc(inventoryRef, inventoryData);
  }

  async deleteInventory(inventory: Inventory): Promise<void> {
    const inventoryRef = doc(this.firestore, COLLECTIONS.INVENTORIES, inventory.id!);
    await deleteDoc(inventoryRef);
  }
}
