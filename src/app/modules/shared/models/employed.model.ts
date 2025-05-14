export interface EmployeeModel {
  id?: string;
  name: string;           // Nombre del empleado
  role: string;           // Cargo
  phone: string;          // Teléfono
  email: string;          // Correo electrónico
  imageURL: string;       // URL de la foto del empleado
  createdAt: Date;        // Fecha de creación del registro
}
