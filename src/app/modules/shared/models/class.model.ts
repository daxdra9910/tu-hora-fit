import { AuditModel } from "./audit.model";

// Clase base
interface ClassBase extends AuditModel {
  name: string;
  description: string;
}

// Clase con ID
interface ClassWithId {
  id: string;
}

// Clase con archivo (antes de subir)
interface ClassWithFile {
  image: File;
}

interface ClassWithOptionalFile {
  image?: File;
}

// Clase con imagen subida
interface ClassWithImage {
  imageURL: string;
}

// Combinaciones finales
export type ClassModel = ClassBase;
export type ClassModelWithId = ClassBase & ClassWithId;
export type ClassModelWithFile = ClassBase & ClassWithFile;
export type ClassModelWithIdAndFile = ClassModelWithId & ClassWithFile;
export type ClassModelWithImage = ClassBase & ClassWithImage;
export type ClassModelWithIdAndImage = ClassModelWithId & ClassWithImage;
export type ClassModelWithIdAndFileAndImage = ClassModelWithId & ClassWithOptionalFile & ClassWithImage;
