import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../shared/models/employee.model';
import { ShiftsService } from '../../shared/services/shifts.service';
import { Observable, forkJoin, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { Shift } from '../../shared/models/shift.model';
import { EmployeesService } from '../../shared/services/employees.service';
import { EmployeeForm } from '../../shared/models/employee-form.model';

@Injectable({
  providedIn: 'root'
})
export class BulkEditService {
  fb = inject(FormBuilder);
  shiftsService = inject(ShiftsService);
  employeesService = inject(EmployeesService);
  employeeForm!: FormGroup;
  employeesToSave: Employee[] = [];
  shiftsToSave: Shift[] = [];

  createForm(data: Employee[]): Observable<FormGroup> {
    const employeeForm = this.fb.group({
      employees: this.fb.array([])
    });

    const requests: Observable<any>[] = [];

    data.forEach(employee => {
      const request = this.shiftsService.getShiftsById(employee.id).pipe(
        map(shifts => {
          const employeeShifts = this.fb.array([]);
          shifts.forEach(shift => {
            (employeeShifts as FormArray).push(this.fb.group({
              clockIn: [shift.clockIn, Validators.required],
              clockOut: [shift.clockOut, Validators.required],
              formattedClockIn: [dayjs(shift.clockIn).format('HH:mm'), Validators.required],
              formattedClockOut: [dayjs(shift.clockOut).format('HH:mm'), Validators.required],
              sum: [{value: dayjs(shift.clockOut - shift.clockIn).format('HH:mm'), disabled: true},Validators.required],
              id: [shift.id],
              employeeId: [employee.id]
            }));
          });
          return this.fb.group({
            name: [employee.name, Validators.required],
            email: [employee.email, Validators.required],
            hourlyRate: [employee.hourlyRate, Validators.required],
            hourlyRateOvertime: [employee.hourlyRateOvertime, Validators.required],
            id: [employee.id],
            selectedDate: [null],
            shifts: employeeShifts
          });
        })
      );
      requests.push(request);
    });

    return forkJoin(requests).pipe(
      map((employees: EmployeeForm[]) => {
        employees.forEach(employee => {
          (employeeForm.get('employees') as FormArray).push(employee);
        });
        this.employeeForm = employeeForm;
        return employeeForm;
      })
    );
  }

  calculateSumColumn(employeeId: number, shiftId: number): void {
    const shifts = this.employees.at(employeeId).get('shifts') as FormArray;
    const shift = shifts.at(shiftId);

    // Splitting the clockIn and clockOut time strings to get hours and minutes
    const [clockInHours, clockInMinutes] = shift.get('formattedClockIn')?.value.split(':').map(Number);
    const [clockOutHours, clockOutMinutes] = shift.get('formattedClockOut')?.value.split(':').map(Number);

    // Creating Day.js objects for clockIn and clockOut times
    const clockInTime = dayjs().hour(clockInHours).minute(clockInMinutes);
    const clockOutTime = dayjs().hour(clockOutHours).minute(clockOutMinutes);

    // Calculating the difference in minutes
    const differenceInMinutes = clockOutTime.diff(clockInTime, 'minute');

    // Calculating the hours and minutes for the difference
    const hours = Math.floor(differenceInMinutes / 60);
    const minutes = differenceInMinutes % 60;
    // Formatting the result into "HH:mm" format
    const sum = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    shift.patchValue({sum})
  }

  get employees() {
    return this.employeeForm?.get('employees') as FormArray;
  }

  findChangedControls(control: AbstractControl) {
    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        const nestedControl = control.get(key);
        if (nestedControl && key !== 'selectedDate') {
          this.findChangedControls(nestedControl);
        }
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach(nestedControl => {
        this.findChangedControls(nestedControl);
      });
    } else if (control.dirty) {
      const parent = this.findParent(control, this.employeeForm);
      if (parent && parent.value) {
        this.sortItemForSave(parent.value);
      }
    }
  }

  findParent(control: AbstractControl, formGroup: FormGroup | FormArray): FormGroup | FormArray | null {
    for (const key in formGroup.controls) {
      const formControl = formGroup.get(key);
      if (formControl === control) {
        return formGroup;
      } else if (formControl instanceof FormGroup) {
        const parent = this.findParent(control, formControl);
        if (parent) return parent;
      } else if (formControl instanceof FormArray) {
        for (let i = 0; i < formControl.length; i++) {
          const parent = this.findParent(control, formControl.at(i) as FormGroup);
          if (parent) return parent;
        }
      }
    }
    return null;
  }

  sortItemForSave(item: any): void {
    if (item.shifts) {
      delete item.shifts;
      delete item.selectedDate;
      this.employeesToSave.push(item);
    } else {
      const shift = this.updateShift(item);
      delete shift.formattedClockIn;
      delete shift.formattedClockOut;
      this.shiftsToSave.push(shift);
    }
  }

  updateShift(item: any) {
    const [clockInHours, clockInMinutes] = item.formattedClockIn?.split(':').map(Number);
    const [clockOutHours, clockOutMinutes] = item.formattedClockOut?.split(':').map(Number);

    item.clockIn = dayjs(item.clockIn).hour(clockInHours).minute(clockInMinutes).valueOf();
    item.clockOut = dayjs(item.clockOut).hour(clockOutHours).minute(clockOutMinutes).valueOf();

    return {...item};
  }

  saveEmployeesAndShifts(): Observable<any[]> {
    this.findChangedControls(this.employeeForm);

    const saveRequests = [];

    if (this.employeesToSave.length) {
      // Save employees
      for (const employee of this.employeesToSave) {
        const request = this.employeesService.saveEmployee(employee);
        saveRequests.push(request);
      }

      this.employeesToSave = [];
    }

    if (this.shiftsToSave.length) {
      // Save shifts
      for (const shift of this.shiftsToSave) {
        const request = this.shiftsService.saveShift(shift);
        saveRequests.push(request);
      }

      this.shiftsToSave = [];
    }

    if (saveRequests.length) {
      // Wait for all requests to complete
      return forkJoin(saveRequests);
    } else {
      return of([]);
    }
  }
}
