import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hourToMinute',
  standalone: true,
})
export class HourToMinutePipe implements PipeTransform {
  transform(value: number): number {
    return Math.round(value * 60);
  }
}
