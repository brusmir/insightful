
import { Employee } from './../shared/models/employee.model';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { BulkEditService } from './shared/bulk-edit.service';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';

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
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatDatepickerModule,
    DatePipe
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './bulk-edit.component.html',
  styleUrl: './bulk-edit.component.scss'
})
export class BulkEditComponent {
  form!: FormGroup;
  aliases!: FormArray;

  constructor(
    public dialogRef: MatDialogRef<BulkEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {employees: Employee[]},
    private bulkEditService: BulkEditService
  ) {}

  displayedColumns = ['shift', 'clockIn', 'clockOut', 'sum'];
  dataSource = [];

  ngOnInit() {
    this.bulkEditService.createFormGroup(this.data.employees);
    this.form = this.bulkEditService.form;
    this.aliases = this.bulkEditService.aliases;
    console.log(this.bulkEditService.form);
  }

  filterShifts(event: MatDatepickerInputEvent<Date>) {
    console.log(event);
  }

  trackByFn(index: number) {
    return index;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onClose() {

  }
}
