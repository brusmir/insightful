import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Shift } from '../models/shift.model';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShiftsService {
  #http = inject(HttpClient);
  #errorHandlerService = inject(ErrorHandlerService);
  #shiftsUrl = 'http://localhost:3000/shifts'

  getShiftsById(employeeId: string) {
    return this.#http.get<Shift[]>(`${this.#shiftsUrl}?employeeId=${employeeId}`).pipe(
      catchError(err => this.#errorHandlerService.handleError(err))
    );
  }

  saveShift(shift: Shift) {
    return this.#http.patch(`${this.#shiftsUrl}/${shift.id}`, shift).pipe(
      catchError(err => this.#errorHandlerService.handleError(err))
    )
  }
}
