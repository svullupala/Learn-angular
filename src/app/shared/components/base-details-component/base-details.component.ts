import {Component, EventEmitter, Input, NgZone, Output, Renderer2} from '@angular/core';
import { SharedService } from '../../shared.service';
import { BaseModel } from '../../index';
import { LinkModel } from '../../models/link.model';
import {KeyboardPopover} from 'shared/util/keyboard-popover';
import {FocusMonitor} from '@angular/cdk/a11y';
import { VadpModel } from 'vadp/vadp.model';

export class IconStringPair {
  constructor(public iconClass: string, public resourceString: string) {}
}

@Component({
  selector: 'base-details-component',
  templateUrl: './base-details.component.html',
  styleUrls: ['./base-details.component.scss']
})
export class BaseDetailsComponent extends KeyboardPopover {

  @Input() models: Array<BaseModel | any> = [];
  @Input() hide: boolean = false;
  @Input() iconList: Array<IconStringPair> = [];
  @Input() enableBorder: boolean = true;
  @Input() multiSelect: boolean = true;
  @Input() enablePopover: boolean = true;
  @Input() useActionLinks: boolean = false;
  @Input() titleTpl: string;
  @Input() topTableText: string;
  @Input() textModifyResources: string;
  @Input() textDelete: string;
  @Input() textNoResourceSelected: string;
  @Input() headerIcon: string = 'i-rbac_role';
  @Output() onDoAction = new EventEmitter<LinkModel>();
  @Output() modifyResourcesClick = new EventEmitter<BaseModel | any>();
  @Output() deleteClick = new EventEmitter<BaseModel | any>();

  get hasResources(): boolean {
    return this.models && this.models.length > 0;
  }

  get hasNoResources(): boolean {
    return this.models && this.models.length === 0;
  }

  get hasMore(): boolean {
    return this.onlyOneResource && (this.canModifyResources() || this.canDeleteResource());
  }

  get onlyOneResource(): boolean {
    return this.models && this.models.length === 1;
  }

  get title(): string {
    return this.hasResources ? (this.models.length > 1 ? SharedService.formatString(this.titleTpl,
      this.models.length) : this.models[0].name || this.models[0].displayName) : '';
  }

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone) {
    super(renderer, focusMonitor, ngZone);
  }

  trackByLinkModel(idx: number, model: LinkModel) {
    return model.href;
  }

  private onModifyResourcesClick(): void {
    if (this.onlyOneResource)
      this.modifyResourcesClick.emit(this.models[0]);
  }

  private onDeleteClick(): void {
    if (this.onlyOneResource)
      this.deleteClick.emit(this.models[0]);
  }


  private canDelete(item: BaseModel | any) {
    let hasLink = item && item.hasLink('delete'),
        cannotDelete = false;
    if (item && (typeof item.canDelete === 'function')) {
      cannotDelete = item.canDelete();
    }
    if (cannotDelete) {
      return false;
    } else {
      return hasLink;
    }
  }

  private canEdit(item: BaseModel | any) {
    let hasLink = item && item.hasLink('edit'),
        cannotEdit = false;
    if (item && (typeof item.canEdit === 'function')) {
      cannotEdit = item.canEdit();
    }
    if (cannotEdit) {
      return false;
    } else {
      return hasLink;
    }
  }

  private canModifyResources(): boolean {
    let me = this, len = (me.models || []).length;
    if (len < 1)
      return false;

    return me.models.findIndex(function (item) {
      return !me.canEdit(item);
    }) === -1;
  }

  private canDeleteResource(): boolean {
    return this.onlyOneResource && this.canDelete(this.models[0]);
  }

  private onDoActionClick(link: LinkModel): void {    
    this.onDoAction.emit(link);
  }

  private getActionLinks(model: VadpModel): Array<LinkModel> {
        // If proxy is unreachable, hide set action
        let linkModelArray:  Array<LinkModel> = model ? (model.getActionLinks()) : [];
        if (model && model.state === 'UNREACHABLE') {
          linkModelArray = linkModelArray.filter((item: LinkModel) => {
            return item.name !== 'proxyoptions';
          });
        }
        return linkModelArray;
  }

  private getActionResourceString(link: LinkModel): string {
    return link.title;
  }

  private checkActionResourceString(link: LinkModel): boolean {
    if(link.name === 'suspend')
      return true;  
    return false;
  }

  private demoFlagIsSet(models: VadpModel) {
    if(models && models.demo === true) 
      return true;
    else return false;
  }
}
