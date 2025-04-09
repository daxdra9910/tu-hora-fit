import {RoleEnum} from "../enums/role.enum";
import {StateEnum} from "../enums/state.enum";
import {AuditModel} from "./audit.model";

export interface UserModel extends AuditModel {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  birthdate: string;
  role: RoleEnum;
  state: StateEnum;
}
