import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Shift } from '../models/shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftsService {
  #http = inject(HttpClient);
  #shiftsUrl = 'http://localhost:3000/shifts'

  getShiftsById(employeeId: string) {
    return this.#http.get<Shift[]>(`${this.#shiftsUrl}?employeeId=${employeeId}`);
  }

  saveShift(shift: Shift) {
    console.log('shift for save', shift);
    return this.#http.patch(`${this.#shiftsUrl}/${shift.id}`, shift)
  }
}
