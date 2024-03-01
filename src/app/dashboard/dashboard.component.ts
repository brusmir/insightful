import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EmployeesTableComponent } from '../employees-table/employees-table.component';
import { EmployeesService } from '../shared/services/employees.service';
import {
  MatDialog
} from '@angular/material/dialog';
import { BulkEditComponent } from '../bulk-edit/bulk-edit.component';
import { AsyncPipe } from '@angular/common';
import { EmployeeSum } from '../shared/models/employee-sum.model';
import { PageData } from '../shared/models/page-data.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [EmployeesTableComponent, AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  pageTitle = 'Dashboard';
  employeesService = inject(EmployeesService);
  dialog = inject(MatDialog);
  employees$ = this.employeesService.employees$;

  onPageChange(event: PageData) {
    this.employeesService.setPageSize(event);
  }

  onBulkEdit({employees, pageData}: {employees: EmployeeSum[], pageData: PageData}) {
    const dialogRef = this.dialog.open(BulkEditComponent, {
      data: {employees},
      width: '80%',
      height: '80%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onPageChange(pageData);
      }
    });
  }
}
