import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {

  transform(value: number | string, currency: string = 'COP'): string {
    if (value === null || value === undefined || isNaN(Number(value))) return '';

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(Number(value));
  }

}
