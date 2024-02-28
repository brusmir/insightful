import { Employee } from './employee.model';
export interface EmployeeSum extends Employee {
  totalClockedIn: number;
  totalPaidRegularHours: number;
  totalPaidOvertimeHours: number;
}
