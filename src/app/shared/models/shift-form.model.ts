import { Shift } from "./shift.model";

export interface ShiftForm extends Shift {
  formattedClockIn: string;
  formattedClockOut: string;
}
