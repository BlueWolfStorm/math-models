import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hourToSecond',
  standalone: true,
})
export class HourToSecondPipe implements PipeTransform {
  transform(value: number): number {
    return Math.round(value * 3600);
  }
}
