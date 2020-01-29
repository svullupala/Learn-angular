import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {SubnetItem} from '../subnet-item.model';

@Component({
  selector: 'subnet-list-table-component',
  templateUrl: 'subnet-list-table.component.html'
})

export class SubnetListTableComponent implements OnInit {

  @ViewChild('subnetform') form: NgForm;
  @Output() editEvent = new EventEmitter<{subnet: SubnetItem, index: number}>();
  @Output() deleteEvent = new EventEmitter<any>();
  @Input() subnetMappingList: Array<SubnetItem> = [];

  constructor() {}

  ngOnInit() {
  }

  public onAddSubnetMapping(subnet: SubnetItem): void {
    if (this.subnetMappingList === undefined) {
      this.subnetMappingList = [];
    }
    this.subnetMappingList.push(subnet);
  }

  public setSubnetList(subnets: Array<SubnetItem>): void {
    if (Array.isArray(subnets) && subnets.length > 0) {
      this.subnetMappingList = subnets;
    } else {
      this.subnetMappingList = [];
    }
  }

  public getValue(): Array<SubnetItem> {
    return this.subnetMappingList;
  }

  public onDeleteMapping(index: number): void {
    this.subnetMappingList.splice(index, 1);
    this.deleteEvent.emit();

  }

  private onEditMapping(subnet: SubnetItem, index: number): void {
    this.editEvent.emit({subnet: subnet, index: index});
  }
}
