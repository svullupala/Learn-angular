import {Component, ViewChild, ElementRef, OnInit, AfterViewInit} from '@angular/core';
import {RbacSingleSelectionView} from 'shared/rbac/rbac-single-selection.view';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from 'core';
import {SharedService} from 'shared/shared.service';
import {RbacModel} from 'shared/rbac/rbac.model';
import {StorageModel} from './shared/storage.model';
import {Observable} from 'rxjs/Observable';
import {DiskTableComponent} from 'diskstorage/disk-table/disk-table.component';
import {DiskEditComponent} from 'diskstorage/disk-edit/disk-edit.component';
import {DiskManageComponent} from 'diskstorage/disk-manage/disk-manage.component';
import { SiteModel } from 'site/site.model';
import { SitesModel } from 'site/sites.model';
import { JsonConvert } from 'json2typescript/index';
import { SiteService } from 'site/site.service';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'backupstorage',
  templateUrl: './disk-storage.component.html',
  providers: [SiteService]
})
export class DiskStorageComponent extends RefreshSameUrl implements AfterViewInit {
  @ViewChild(DiskTableComponent) tableContainer: DiskTableComponent;
  @ViewChild(DiskEditComponent) editContainer: DiskEditComponent;
  @ViewChild(DiskManageComponent) manageContainer: DiskManageComponent;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  infoTitle: string = undefined;

  private cardTitle: string = '';
  private textNewStorage: string;
  private textEditStorage: string;
  private mode: string = 'list';
  private textAddNewSite: string;
  private siteDropdownData: Array<SiteModel>;
  private siteMap = [];
  private model: StorageModel = new StorageModel();
  private showCreateDiskButton: boolean = false;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute,
              private translate: TranslateService, private siteService: SiteService) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  ngOnInit() {
    let me = this;

    super.ngOnInit();

    me.translate.get([
      'common.infoTitle',
      'storage.textAddNewSite',
      'storage.textNewStorage',
      'storage.textEditStorage'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textNewStorage = resource['storage.textNewStorage'];
        me.textEditStorage = resource['storage.textEditStorage'];
        me.textAddNewSite = resource['storage.textAddNewSite'];
        me.loadSites();
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngAfterViewInit() {
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

  onAddClick() {
    let me = this;

    me.mode = 'edit';
    me.model = new StorageModel();
    me.cardTitle = me.textNewStorage;
    me.editContainer.onAddClick();
  }

  onEditClick(item: StorageModel) {
    let me = this;

    me.mode = 'edit';
    me.model = item;
    me.cardTitle = me.textEditStorage + ' ' + me.model.name;
    me.editContainer.onEditClick(item);
  }

  onManageClick(item: StorageModel) {
    this.mode = 'manage';
    this.model = item;
    this.manageContainer.onManageClick(item);
  }

  onCancelClick() {
    this.mode = 'list';
    this.model = new StorageModel();
  }

  onSaveClick(refreshSites: boolean){
    this.mode = 'list';
    if (refreshSites) {
      this.loadSites(true);
    } else {
      this.tableContainer.onRefresh();
    }
  }

  private delay(callback: any, interval: number) {
    let sub: any = Observable.interval(interval).take(1).subscribe(
      () => {
        callback();
        sub.unsubscribe();
      }
    );
  }

  private setCreateDiskButton(value: boolean) {
    let me = this;
    me.showCreateDiskButton = value;
  }

  private loadSites(forceTableRefresh: boolean = false) {
    let me = this, newSite = new SiteModel();
    newSite.id = 'new';
    newSite.name = me.textAddNewSite;
    me.siteDropdownData = [];
    me.siteDropdownData.push(newSite);
    me.siteService.getAll()
      .subscribe(
        data => {
          let dataset = JsonConvert.deserializeObject(data, SitesModel);
          me.siteDropdownData = me.siteDropdownData.concat(<Array<SiteModel>> dataset.records || []);
          for (let item of me.siteDropdownData){
            me.siteMap[item.id] = item.name;
          }
          if (forceTableRefresh) {
            this.tableContainer.onRefresh();
          }
        },
        err => me.handleError(err)
      );
  }
}
