import { Employee } from "./employee.model";
import { ShiftForm } from "./shift-form.model";

export interface EmployeeForm extends Employee {
  selectedDate: string;
  shifts: ShiftForm
}
