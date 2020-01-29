import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ChangeDetectionStrategy
} from "@angular/core";
import { SorterModel } from "shared/models/sorter.model";

export interface ColumnDef {
  id: string;
  header: string;
  width?: string;
  sortable?: SorterModel;
  dynamicCellComponent?: any;
}

/**
 *  A dynamic table component based on cdkTable,
 *
 *     Inputs:
 *          columnDef - definition of columns, determine which cells are rendered and in which order,
 *                      use dynamicCellComponent to dynamically render component in the cell
 *          data - data to be diplayed in table. Each 'key' should correspond with columnDef 'id'
 *
 *      e.g. columnDef = [
 *                       { id: 'name', header: 'Company Name' },
 *                       { id: 'custom', header: 'Logo', width: '10%', dynamicCellComponent: LogoComponent }
 *                       ];
 *
 *         data = [{ name: 'XSoft', custom: { display: true, callback: handleClick}}]
 */

@Component({
  selector: "ba-table",
  templateUrl: "./ba-table.component.html",
  styleUrls: ["./ba-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaTableComponent implements OnInit {
  @Output() onSort = new EventEmitter<string>();
  @Output() onRowSelect = new EventEmitter<string>();
  @Input() columnDef: ColumnDef[];
  @Input() data: any[];

  private displayedColumns: any[];
  private selectedRow: {} = null;

  constructor() {}

  ngOnChanges() {
    if (this.columnDef) {
      this.displayedColumns = this.columnDef.map(c => c.id);
    }
  }

  ngOnInit(): void {}

  handleSort(columnId: string) {
    this.onSort.emit(columnId);
  }

  handleSelect(row: any) {
    this.selectedRow = row;
    this.onRowSelect.emit(row);
  }
}
