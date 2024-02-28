import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../shared/models/employee.model';
import { ShiftsService } from '../../shared/services/shifts.service';
import { Observable, forkJoin, map } from 'rxjs';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root'
})
export class BulkEditService {
  fb = inject(FormBuilder);
  shiftsService = inject(ShiftsService);
  form!: FormGroup;

  createFormGroup(data: Employee[]): void {
    this.form = this.fb.group({
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
              sum: [shift.clockIn + shift.clockOut, Validators.required]
            }));
          });
          return this.fb.group({
            name: [employee.name, Validators.required],
            hourlyRate: [employee.hourlyRate, Validators.required],
            hourlyRateOvertime: [employee.hourlyRateOvertime, Validators.required],
            shifts: employeeShifts
          });
        })
      );
      requests.push(request);
    });

    forkJoin(requests).subscribe((aliases: any[]) => {
      aliases.forEach(alias => {
        (this.form.get('employees') as FormArray).push(alias);
      });
    });
  }

  get aliases() {
    return this.form.get('employees') as FormArray;
  }
}
