import { Component, ViewChild, Output, EventEmitter, Input, ChangeDetectionStrategy, AfterViewInit, OnChanges } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeSum } from '../shared/models/employee-sum.model';
import { CurrencyPipe } from '@angular/common';
import { PageData } from '../shared/models/page-data.model';

@Component({
  selector: 'app-employees-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatSortModule, MatCheckboxModule, MatButtonModule, CurrencyPipe],
  templateUrl: './employees-table.component.html',
  styleUrl: './employees-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesTableComponent implements AfterViewInit, OnChanges {
  @Input() employees!:EmployeeSum[];
  @Output() pageChange = new EventEmitter<PageData>();
  @Output() bulkEdit = new EventEmitter<{employees: EmployeeSum[], pageData: PageData}>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['select', 'name', 'email', 'totalClockedIn', 'totalPaidRegularHours', 'totalPaidOvertimeHours'];
  dataSource!: MatTableDataSource<EmployeeSum>;
  selection = new SelectionModel<EmployeeSum>(true, []);
  isLoadingEmployees = false;

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(): void {
    this.dataSource = new MatTableDataSource(this.employees);
    this.isLoadingEmployees = false;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource?.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: EmployeeSum): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }

  onPageChange(event: PageEvent) {
    this.isLoadingEmployees = true;
    this.pageChange.emit({page: event.pageIndex + 1, limit: event.pageSize});
  }

  onEditBulk() {
    const pageData = {page: this.paginator.pageIndex + 1, limit: this.paginator.pageSize};
    this.bulkEdit.emit({employees: this.selection.selected, pageData});
    this.selection.clear();
  }

  getTotalEmployees() {
    return this.dataSource.data.slice(0, this.paginator?.pageSize).length;
  }

  getTotalClockedInTime() {
    return this.dataSource.data.slice(0, this.paginator?.pageSize).map(employee => employee.totalClockedIn).reduce((acc, value) => acc + value, 0 )
  }

  getTotalRegularHoursPaid() {
    return this.dataSource.data.slice(0, this.paginator?.pageSize).map(employee => employee).reduce((acc, value) => acc + value.totalPaidRegularHours * value.hourlyRate, 0 )
  }

  getTotalOvertimeHoursPaid() {
    return this.dataSource.data.slice(0, this.paginator?.pageSize).map(employee => employee).reduce((acc, value) => acc + value.totalPaidOvertimeHours * value.hourlyRateOvertime, 0 )
  }
}

