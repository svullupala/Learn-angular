import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AppServerModel} from 'appserver/appserver.model';
import {LinkModel} from 'shared/models/link.model';

export type AppserverCardActionEventParam = { item: AppServerModel, link: LinkModel };

@Component({
  selector: 'appserver-card',
  templateUrl: './appserver-card.component.html',
  styleUrls: ['./appserver-card.component.scss']
})
export class AppserverCardComponent {
  @Input() item: AppServerModel;
  @Output() select = new EventEmitter<AppServerModel>();
  @Output() edit = new EventEmitter<AppServerModel>();
  @Output() remove = new EventEmitter<AppServerModel>();
  @Output() action = new EventEmitter<AppserverCardActionEventParam>();

  isDropdownHovered: boolean = false;

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

  onExecuteAction(item: AppServerModel, link: LinkModel): void {
    this.action.emit({item: item, link: link});
  }

  onRemove(item: AppServerModel) {
    this.remove.emit(item);
  }

  onEdit(item: AppServerModel) {
    this.edit.emit(item);
  }
}
