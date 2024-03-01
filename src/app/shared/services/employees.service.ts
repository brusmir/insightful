import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, catchError, concatMap, forkJoin, map, switchMap } from 'rxjs';
import { Employee } from '../models/employee.model';
import { PageEvent } from '@angular/material/paginator';
import { Shift } from '../models/shift.model';
import dayjs from 'dayjs';
import { ShiftsService } from './shifts.service';
import { PageData } from '../models/page-data.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  #http = inject(HttpClient);
  #employeesUrl = 'http://localhost:3000/employees'
  #shiftService = inject(ShiftsService);

  #pageSubject = new BehaviorSubject<PageData>({page: 0, limit: 5});
  pageAction$ = this.#pageSubject.asObservable();
  employees$ = this.pageAction$.pipe(
    concatMap(({page, limit}) => this.#http.get<Employee[]>(`${this.#employeesUrl}?_page=${page}&_limit=${limit}`).pipe(
      switchMap(employees => {
        const employeeObservables = employees.map(employee =>
          this.#shiftService.getShiftsById(employee.id).pipe(
            map(shifts => {
              const { totalClockedInTime, totalRegularHours, totalOvertime } = this.calculateTotalHours(shifts);
              return {
                ...employee,
                totalClockedIn: totalClockedInTime,
                totalPaidRegularHours: totalRegularHours,
                totalPaidOvertimeHours: totalOvertime
              };
            })
          )
        );
        return forkJoin(employeeObservables);
      })
    )),
    catchError(err => this.#handleError(err))
  );

  setPageSize(page: PageEvent) {
    this.#pageSubject.next({page: page.pageIndex, limit: page.pageSize});
  }

  calculateTotalHours(shifts: Shift[]): { totalClockedInTime: number, totalRegularHours: number, totalOvertime: number } {
    const shiftsPerDay = new Map<number, {regularHours: number}>();
    let totalRegularHours = 0;
    let totalOvertime = 0;
    let totalClockedInTime = 0;
    shifts.forEach((curr) => {
      const time = dayjs(curr.clockOut).hour() - dayjs(curr.clockIn).hour();
      const date = dayjs(curr.clockIn).date();
      if (time > 0) {
        if (date && shiftsPerDay.get(date)) {
          const value = (shiftsPerDay.get(date) as {regularHours: number, overtimeHours: number}).regularHours + time;
          shiftsPerDay.set(date, {
            regularHours: value
          })
        } else {
          shiftsPerDay.set(date, {
            regularHours: time
          })
        }
      } else if (curr.clockIn > curr.clockOut) {
        const timeBetweenTwoDays = 24 - dayjs(curr.clockIn).hour() + dayjs(curr.clockOut).hour();
        if (shiftsPerDay.get(date)) {
          const value = (shiftsPerDay.get(date) as {regularHours: number, overtimeHours: number}).regularHours + timeBetweenTwoDays;
          shiftsPerDay.set(date, {
            regularHours: value
          })
        } else {
          shiftsPerDay.set(date, {
            regularHours: timeBetweenTwoDays
          })
        }
      }
    }, 0);
    for(let [key, value] of shiftsPerDay) {
      totalClockedInTime += value.regularHours;
      totalRegularHours += value.regularHours <= 8 ? value.regularHours : 8;
      totalOvertime += value.regularHours - 8;
    }
    return { totalClockedInTime, totalRegularHours, totalOvertime };
  }

  saveEmployee(employee: Employee) {
    return this.#http.patch(`${this.#employeesUrl}/${employee.id}`, employee);
  }

  #handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message
        }`;
    }
    console.error(errorMessage);

    return EMPTY;
  }
}
