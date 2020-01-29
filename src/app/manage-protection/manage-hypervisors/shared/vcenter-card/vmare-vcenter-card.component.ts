import {Component, EventEmitter, Input, Output} from '@angular/core';

import { HypervisorModel } from 'hypervisor/shared/hypervisor.model';
import { HypervisorManageService } from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import { ErrorHandlerComponent } from 'shared/components';

@Component({
  selector: 'vmare-vcenter-card',
  templateUrl: './vmare-vcenter-card.component.html',
  styleUrls: ['./vmare-vcenter-card.component.scss']
})
export class VmareVcenterCardComponent {
  @Input() item: HypervisorModel;
  @Output() select = new EventEmitter<HypervisorModel>();
  @Output() edit = new EventEmitter<HypervisorModel>();
  @Output() remove = new EventEmitter<HypervisorModel>();

  isDropdownHovered: boolean = false;
  errorHandler: ErrorHandlerComponent;

  constructor(private hypervisorService: HypervisorManageService) {}

  onDropdownMouseEnter(): void {
    this.isDropdownHovered = true;
  }

  onDropdownMouseLeave(): void {
    this.isDropdownHovered = false;
  }

  onClick(item, event: any): void {
    if (!event.fromMenu)
      this.select.emit(item);
  }

  onMenuClick(event: any): void {
    event.fromMenu = true;
  }

  runInventory(linkName: string): void {
    const observable = this.item.doAction<HypervisorModel>(
      HypervisorModel,
      linkName,
      {},
      this.hypervisorService.proxy
    );

    if (observable) {
      observable.filter(updated => !!updated).subscribe(() => {}, err => this.handleError(err));
    }
  }

  onRemove(item: HypervisorModel) {
    this.remove.emit(item);
  }

  onEdit(item: HypervisorModel) {
    this.edit.emit(item);
  }

  private handleError(err: any, node?: boolean): void {
    if (this.errorHandler) this.errorHandler.handle(err, node);
  }
}
