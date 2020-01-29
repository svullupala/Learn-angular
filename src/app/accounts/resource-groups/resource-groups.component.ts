import { AfterViewInit, Component, ViewChild } from '@angular/core';
import 'rxjs/add/operator/delay';
import { TranslateService } from '@ngx-translate/core';
import { AlertType, AlertComponent, ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';
import { ResourceGroupTableComponent } from './resource-group-table/resource-group-table.component';
import { FilterModel } from 'shared/models/filter.model';
import { SdlSearchBarComponent } from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import { ResourceGroupModel } from './resource-group.model';
import { DatasetModel } from 'shared/models/dataset.model';
import { LinkModel } from 'shared/models/link.model';
import { Subject } from 'rxjs/Subject';
import { ResourceGroupsService } from './resource-groups.service';
import { Observable } from 'rxjs/Observable';
import { ResourceGroupDetailsComponent } from './resource-group-details/resource-group-details.component';
import { ResourceGroupEditComponent } from './resource-group-edit';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'resource-groups',
  styleUrls: ['./resource-groups.scss'],
  templateUrl: './resource-groups.component.html'
})
export class ResourceGroupsComponent extends RefreshSameUrl implements AfterViewInit {

  mode: string = 'list';
  resourceGroup: ResourceGroupModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  createLink: LinkModel;
  canCreate: boolean = false;

  @ViewChild(ResourceGroupTableComponent) selectTable: ResourceGroupTableComponent;
  @ViewChild(ResourceGroupDetailsComponent) detailsComponent: ResourceGroupDetailsComponent;
  @ViewChild(ResourceGroupEditComponent) editComponent: ResourceGroupEditComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  private selectedGroups: Array<ResourceGroupModel> = [];
  private namePattern: string = '';
  private hideSearchOutput: boolean = false;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textSearchFor: string;
  private subs: Subject<void> = new Subject<void>();

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService, private resourceGroupService: ResourceGroupsService) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.resourceGroup = new ResourceGroupModel();
    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'resourceGroups.textSearchFor']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSearchFor = resource['resourceGroups.textSearchFor'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.startSearch();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngAfterViewInit() {
    this.searchBarComponent.focusSearchField();
  }

  info(message: string, title?: string, type?: AlertType) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message, type);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private onCreateClick() {
    this.mode = 'edit';
  }

  private onCancelClick() {
    this.mode = 'list';
    this.selectedGroups = [];
  }

  private onSaveSuccess() {
    this.mode = 'list';
    this.refresh();
  }

  private getSearchFilters(): FilterModel[] {
    let me = this, result: FilterModel[] = [];

    if (me.namePattern && me.namePattern.trim().length > 0)
      result.push(new FilterModel('name', me.namePattern.trim()));

    return result;
  }

  private onEditClick(item: ResourceGroupModel) {
    let me = this,
        observable: Observable<any> = item && item.getRecord<ResourceGroupModel>(ResourceGroupModel, 'self');
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        record => {
          me.onResourceGroupLoad(record);
        },
        err => {
          me.handleError(err, false);
        }
      );
  }

  private onDeleteClick(item: ResourceGroupModel) {
    this.resourceGroupService.deleteResource(item);
  }

  private emptySelectedGroups(): void { this.selectedGroups = []; }

  private onResourceGroupLoad(item: ResourceGroupModel): void {
    this.mode = 'edit';
    this.resourceGroup = item;
    this.resourceGroup.method = this.mode;
    if (this.editComponent) {
      this.editComponent.setResources(this.resourceGroup);
    }
  }

  private onResourceGroupsLoad(resourceGroups: DatasetModel<ResourceGroupModel>): void {
    this.createLink = resourceGroups.getLink('create');
    this.canCreate = this.createLink !== undefined;
  }

  private refresh(): void {
    this.startSearch();
  }

  private startSearch(namePattern?: string): void {
    let me = this;
    if (!me.selectTable)
      return;
    me.namePattern = namePattern;
    me.selectTable.loadData(false, me.getSearchFilters());
    me.hideSearchOutput = false;
  }

  private onSelectionChange(items: Array<ResourceGroupModel>): void {
    this.selectedGroups = items;
    if (this.detailsComponent) {
      this.detailsComponent.setMultiResources(items);
    }
  }
}

