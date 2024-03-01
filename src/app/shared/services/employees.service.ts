import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, switchMap } from 'rxjs';
import { Employee } from '../models/employee.model';
import { Shift } from '../models/shift.model';
import dayjs from 'dayjs';
import { ShiftsService } from './shifts.service';
import { PageData } from '../models/page-data.model';
import { ErrorHandlerService } from '../../core/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  #http = inject(HttpClient);
  #shiftService = inject(ShiftsService);
  #errorHandlerService = inject(ErrorHandlerService);
  #employeesUrl = 'http://localhost:3000/employees'

  #pageSubject = new BehaviorSubject<PageData>({page: 0, limit: 5});
  pageAction$ = this.#pageSubject.asObservable();
  employees$ = this.pageAction$.pipe(
    switchMap(({page, limit}) => this.#http.get<Employee[]>(`${this.#employeesUrl}?_page=${page}&_limit=${limit}`).pipe(
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
    catchError(err => this.#errorHandlerService.handleError(err))
  );

  setPageSize(page: PageData) {
    this.#pageSubject.next(page);
  }

  saveEmployee(employee: Employee) {
    return this.#http.patch(`${this.#employeesUrl}/${employee.id}`, employee).pipe(
      catchError(err => this.#errorHandlerService.handleError(err))
    );
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
    for(const [key, value] of shiftsPerDay) {
      totalClockedInTime += value.regularHours;
      totalRegularHours += value.regularHours <= 8 ? value.regularHours : 8;
      totalOvertime += value.regularHours - 8;
    }
    return { totalClockedInTime, totalRegularHours, totalOvertime };
  }
}
