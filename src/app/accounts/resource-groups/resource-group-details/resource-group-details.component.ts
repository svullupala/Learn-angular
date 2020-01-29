import {Component, EventEmitter, Input, NgZone, Output, Renderer2, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RestService } from 'core';
import { SharedService } from 'shared/shared.service';
import { ResourceGroupModel } from '../resource-group.model';
import { ResourceGroupsService } from '../resource-groups.service';
import { ResourceGroupListComponent } from '../resource-group-list/resource-group-list.component';
import {KeyboardPopover} from 'shared/util/keyboard-popover';
import {FocusMonitor} from '@angular/cdk/a11y';

@Component({
  selector: 'resource-group-details',
  templateUrl: './resource-group-details.component.html',
  styleUrls: ['./resource-group-details.component.scss']
})
export class ResourceGroupDetailsComponent extends KeyboardPopover {

  @Input() models: Array<ResourceGroupModel> = [];
  @Output() modifyResourcesClick = new EventEmitter<ResourceGroupModel>();
  @Output() deleteUserClick = new EventEmitter<ResourceGroupModel>();
  @ViewChild(ResourceGroupListComponent) resourceGroupList: ResourceGroupListComponent;
  private textSelectedGroupsTitleTpl: string;

  get hasUsers(): boolean {
    return this.models && this.models.length > 0;
  }

  get hasMore(): boolean {
    return this.onlyOneUser && (this.canModifyResources() || this.canDeleteUser());
  }

  get onlyOneUser(): boolean {
    return this.models && this.models.length === 1;
  }

  get title(): string {
    return this.hasUsers ? (this.models.length > 1 ? SharedService.formatString(this.textSelectedGroupsTitleTpl,
      this.models.length) : this.models[0].name) : '';
  }

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private rest: RestService,
              private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService) {
    super(renderer, focusMonitor, ngZone);
  }

  ngOnInit(): void {
    let me = this;
    super.ngOnInit();

    me.translate.get([
      'resourceGroups.textSelectedGroupsTitleTpl'
    ]).subscribe((resource: Object) => {
        me.textSelectedGroupsTitleTpl = resource['resourceGroups.textSelectedGroupsTitleTpl'];
      });
  }

  public setMultiResources(resourceGroups: Array<ResourceGroupModel>): void {
    if (this.resourceGroupList) {
      this.resourceGroupList.setMultiResources(resourceGroups);
    }
  }

  private onModifyResourcesClick(): void {
    if (this.onlyOneUser)
      this.modifyResourcesClick.emit(this.models[0]);
  }

  private onDeleteUserClick(): void {
    if (this.onlyOneUser)
      this.deleteUserClick.emit(this.models[0]);
  }


  private canDelete(item: ResourceGroupModel) {
    let canned = item && item.canned,
      hasLink = item && item.hasLink('delete');
    if (canned) {
      return false;
    } else {
      return hasLink;
    }
  }

  private canEdit(item: ResourceGroupModel) {
    let canned = item && item.canned,
      hasLink = item && item.hasLink('edit');
    if (canned) {
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

  private canDeleteUser(): boolean {
    return this.onlyOneUser && this.canDelete(this.models[0]);
  }
}
