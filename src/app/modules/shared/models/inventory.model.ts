export interface Inventory {
  id?: string;        // ID opcional generado por Firestore
  photoURL: string;   // URL de la foto del equipo
  name: string;       // Nombre del equipo
  quantity: number;   // Cantidad disponible
  createdAt: Date;    // Fecha de creación
}
