import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'filterByDate',
  standalone: true
})
export class FilterByDatePipe implements PipeTransform {

  transform(array: any[], filterDate: Date): any[] {
    if (!array || !filterDate) {
      return array;
    }

    // Filter the array based on the date
    return array.filter(item => {
      // Convert the timestamps to Day.js objects
      const date1 = dayjs(filterDate);
      const date2 = dayjs(item.clockIn);

      // Check if the day of both dates are the same
      return  date1.isSame(date2, 'day');
    });
  }

}
