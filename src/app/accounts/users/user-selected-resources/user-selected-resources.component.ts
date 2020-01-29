import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {ResourceGroupModel} from '../../resource-groups/resource-group.model';
import {SelectorService} from 'shared/selector/selector.service';
import {genericSelectorFactory} from 'shared/selector/selector.factory';
import {isArray} from 'rxjs/util/isArray';

export function restoreItemSelectorFactory(): SelectorService<ResourceGroupModel> {
  return genericSelectorFactory<ResourceGroupModel>();
}

@Component({
  selector: 'user-selected-resources',
  templateUrl: './user-selected-resources.component.html',
  styleUrls: ['./user-selected-resources.component.scss'],
  providers: [
    {provide: SelectorService, useFactory: restoreItemSelectorFactory}
  ]
})
export class UserSelectedResourcesComponent implements OnInit {
  @Input() model: ResourceGroupModel[];
  @Output() addItem = new EventEmitter<ResourceGroupModel[]>();
  @Output() removeItem = new EventEmitter<ResourceGroupModel[]>();

  private get records(): Array<ResourceGroupModel> {
    return this.selector.selection() || [];
  }

  constructor(private selector: SelectorService<ResourceGroupModel>) {
  }

  ngOnInit(): void {
    let items = this.model;
    if (items && items.length > 0) {
      this.selector.select(this.model);
      this.addItem.emit(items);
    }
  }

  public getValue(): Array<ResourceGroupModel> {
    return this.records;
  }

  public add(item: ResourceGroupModel | ResourceGroupModel[]): void {
    this.selector.select(item);
    this.addItem.emit(isArray(item) ? item : [item]);
  }

  public remove(item: ResourceGroupModel): void {
    this.selector.deselect(item);
    this.removeItem.emit([item]);
  }

  public removeAll(): void {
    let items = this.selector.selection();
    this.selector.deselectAll();
    this.removeItem.emit(items);
  }
}
