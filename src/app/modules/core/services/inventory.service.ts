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

import { Storage, ref as storageRef, deleteObject } from '@angular/fire/storage'; // 👈 añadimos

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage); // 👈 inyectamos Storage

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
    const { id, ...inventoryData } = inventory;
    await updateDoc(inventoryRef, inventoryData);
  }

  async deleteInventory(inventory: Inventory): Promise<void> {
    const inventoryRef = doc(this.firestore, COLLECTIONS.INVENTORIES, inventory.id!);
    await deleteDoc(inventoryRef);

    // 🔥 Eliminar imagen del Storage si existe
    if (inventory.photoURL) {
      try {
        const imageRef = storageRef(this.storage, inventory.photoURL);
        await deleteObject(imageRef);
        console.log('✅ Imagen eliminada del Storage');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen del Storage:', error);
      }
    }
  }
}
