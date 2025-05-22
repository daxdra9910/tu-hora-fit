import { AuditModel } from "./audit.model";

interface EmployeeBase extends AuditModel {
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface EmployeeWithId {
  id: string;
}

interface EmployeeWithFile {
  image: File;
}

interface EmployeeWithOptionalFile {
  image?: File;
}

interface EmployeeWithImage {
  imageURL: string;
}

export type EmployeeModel = EmployeeBase;
export type EmployeeModelWithId = EmployeeBase & EmployeeWithId;
export type EmployeeModelWithFile = EmployeeBase & EmployeeWithFile;
export type EmployeeModelWithIdAndFile = EmployeeModelWithId & EmployeeWithFile;
export type EmployeeModelWithImage = EmployeeBase & EmployeeWithImage;
export type EmployeeModelWithIdAndImage = EmployeeModelWithId & EmployeeWithImage;
export type EmployeeModelWithIdAndFileAndImage = EmployeeModelWithId & EmployeeWithOptionalFile & EmployeeWithImage;