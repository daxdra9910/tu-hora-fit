import {Pipe, PipeTransform} from '@angular/core';
import {StateEnum} from "../enums/state.enum";

@Pipe({
  name: 'state',
  standalone: true
})
export class StatePipe implements PipeTransform {

  transform(value: StateEnum): string {
    if (value === StateEnum.ACTIVE) return 'Activo';
    if (value === StateEnum.INACTIVE) return 'Inactivo';
    return value;
  }

}
