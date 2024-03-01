import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'timestampToHours',
  standalone: true
})
export class TimestampToHoursPipe implements PipeTransform {

  transform(timestamp: number): string {
    if (!timestamp || isNaN(timestamp)) {
      return '';
    }

    const formattedTime = dayjs(timestamp).format('HH:mm');
    return formattedTime;
  }

}
