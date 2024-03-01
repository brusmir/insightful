import { Observable, tap } from 'rxjs';
import { ChangeDetectionStrategy, Component, DestroyRef, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { BulkEditService } from './shared/bulk-edit.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FilterByDatePipe } from '../shared/filter-by-date.pipe';
import { Employee } from './../shared/models/employee.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bulk-edit',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatDatepickerModule,
    DatePipe,
    FilterByDatePipe,
    MatProgressSpinnerModule,
    AsyncPipe
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './bulk-edit.component.html',
  styleUrl: './bulk-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkEditComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeForm$!: Observable<FormGroup>;
  employees!: FormArray;
  showSpinner = false;

  constructor(
    public dialogRef: MatDialogRef<BulkEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {employees: Employee[]},
    private bulkEditService: BulkEditService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.employeeForm$ = this.bulkEditService.createForm(this.data.employees).pipe(
      tap(form => {
        this.employeeForm = form;
        this.employees = this.bulkEditService.employees;
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  calculateSumColumn(employeeId: number, shiftId: number): void {
    if ((employeeId || employeeId === 0) && (shiftId || shiftId === 0)) {
      this.bulkEditService.calculateSumColumn(employeeId, shiftId);
    }
  }

  trackByFn(index: number): number {
    return index;
  }

  onFormSubmit(): void {
    if (!this.employeeForm.pristine) {
      this.showSpinner = true;
      this.bulkEditService.saveEmployeesAndShifts().subscribe(() => {
        this.showSpinner = false;
        this.dialogRef.close(true);
      })
    } else {
      this.dialogRef.close();
    }
  }
}
