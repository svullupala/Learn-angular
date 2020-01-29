import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {AppServerModel} from 'appserver/appserver.model';
import {AlertComponent, AlertType, ConfigGroupsComponent, ErrorHandlerComponent} from 'shared/components';
import {ApplicationInventoryService} from '../application-inventory.service';
import {SessionService} from 'core';
import {Observable} from 'rxjs';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {ApplicationsModel} from 'application/shared/applications.model';
import {forkJoin} from 'rxjs/observable/forkJoin';
import {InventoryAggrCountResult} from 'inventory/inventory.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {AppServerService} from 'appserver/appserver.service';
import {SharedService} from 'shared/shared.service';
import {HttpErrorResponse} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {ConfigGroupsTestTaskModel} from 'shared/models/config-groups.model';
import {AppserverCardActionEventParam} from '..';

@Component({
  selector: 'application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss'],
})
export class ApplicationListComponent {
  @Input() applicationType: string;
  @Output() itemSelect = new EventEmitter<AppServerModel>();
  @Output() itemEdit = new EventEmitter<AppServerModel>();
  @ViewChild(ConfigGroupsComponent) configGroupsComponent: ConfigGroupsComponent;
  testResult: ConfigGroupsTestTaskModel;
  alert: AlertComponent;
  records: Array<AppServerModel> = [];
  totalRecords: number = 0;
  errorHandler: ErrorHandlerComponent;

  private infoTitle: string;
  private unregistrationSucceedMsg: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private textTestResultTpl: string;
  private masked: boolean = false;
  private testAborted: boolean = false;

  constructor(
    private translate: TranslateService,
    private appServerService: AppServerService,
    private inventoryService: ApplicationInventoryService
  ) {
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  ngOnInit(): void {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.loadData();

    this.translate.get([
      'common.infoTitle',
      'common.textConfirm',
      'application.textConfirmUnregister',
      'application.unregistrationSucceedMsg',
      'application.textTestResultTpl'
    ])
      .subscribe((resource: Object) => {
        this.infoTitle = resource['common.infoTitle'];
        this.textConfirm = resource['common.textConfirm'];
        this.textConfirmUnregister = resource['application.textConfirmUnregister'];
        this.unregistrationSucceedMsg = resource['application.unregistrationSucceedMsg'];
        this.textTestResultTpl = resource['application.textTestResultTpl'];
      });
  }


  refresh(): void {
    this.loadData();
  }

  search(value: string): void {
  }

  onSelectSearchResult(item: BaseApplicationModel): void {
    // TODO: Do something with selected resource.
  }

  onItemSelect(item: AppServerModel): void {
    this.itemSelect.emit(item);
  }

  onItemEdit(item: AppServerModel): void {
    this.itemEdit.emit(item);
  }

  onItemRemove(item: AppServerModel): void {
    let me = this;
    me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
      AlertType.UNREGISTER, () => {
        me.appServerService.unregisterAppserver(item, item.type).subscribe(
          (res: Object) => {
            me.alert.hide();
            me.alert.show(me.infoTitle, me.unregistrationSucceedMsg);
            me.refresh();
          },
          (error: HttpErrorResponse) => {
            me.alert.hide();
            me.handleError(error);
          }
        );
      });
  }

  onExecuteAction(param: AppserverCardActionEventParam): void {
    this.doAction(param.item, param.link.name);
  }

  private refreshDisplayFields(target: AppServerModel, updated: AppServerModel): void {
    target.name = updated.name;
    target.hostAddress = updated.hostAddress;
    target.links = updated.links;
  }

  private getActionPayload(name: string): Object {
    return name === 'test' ? {type: 'application'} : {};
  }

  private onAbortTestClick(): void {
    this.testAborted = true;
    this.unmask();
    this.alert.hide();
  }

  private presentTestResult(item: AppServerModel, result: ConfigGroupsTestTaskModel): void {
    if (this.configGroupsComponent) {
      this.testResult = result;
      this.alert.show(SharedService.formatString(this.textTestResultTpl, item.hostAddress),
        this.configGroupsComponent.template, AlertType.TEMPLATE, undefined, undefined,
        0, !result.testsComplete);
    }
  }

  private waitTestComplete(item: AppServerModel, task: ConfigGroupsTestTaskModel,
                           delay: number,
                           mask?: boolean): void {
    let me = this, observable: Observable<ConfigGroupsTestTaskModel>;

    if (me.testAborted) {
      me.unmask();
      return;
    }

    if (mask)
      me.mask();

    me.presentTestResult(item, task);

    observable = task.query();
    if (observable)
      observable.delay(delay).subscribe(
        record => {
          if (!record.testsComplete)
            me.waitTestComplete(item, record, 5000, false);
          else {
            me.unmask();
            if (!me.testAborted)
              me.presentTestResult(item, record);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        }
      );
    else {
      me.unmask();
    }
  }

  private doAction(item: AppServerModel, name: string): void {
    let me = this, payload = me.getActionPayload(name), demo = false,
      observable: Observable<ConfigGroupsTestTaskModel | AppServerModel> = (name === 'test') ?
        item.doAction<ConfigGroupsTestTaskModel>(ConfigGroupsTestTaskModel, name, payload,
          me.inventoryService.proxy) :
        item.doAction<AppServerModel>(AppServerModel, name, payload, me.inventoryService.proxy);
    if (observable) {
      me.mask();
      observable.subscribe(
        record => {
          if (record) {
            me.unmask();
            if (name === 'test') {
              me.testAborted = false;
              me.waitTestComplete(item, <ConfigGroupsTestTaskModel>record, 500, true);
            } else
              me.refreshDisplayFields(item, <AppServerModel>record);
          }
        },
        err => {
          me.unmask();
          me.handleError(err);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private loadData(): void {
    const filters = [new FilterModel('applicationType', this.applicationType)];
    const sorters = [new SorterModel('name', 'ASC')];

    this.appServerService.getAppservers(filters).subscribe(
      dataset => {
        const records = <Array<AppServerModel>>dataset.records;
        this.totalRecords = dataset.total;

        forkJoin(this.getNumberOfTotalDbs(), this.getNumberOfUnprotectedDbs()).subscribe(
          ([total, unprotected]) => {
            this.records = records.map(record => {
              const totalDbs = total.find(db => db.group === record.id);
              const unprotectedDbs = unprotected.find(db => db.group === record.id);

              record.totalDbs = totalDbs && totalDbs.count;
              record.unprotectedDbs = unprotectedDbs && unprotectedDbs.count;

              return record;
            });
          },
          err => this.handleError(err)
        );
      },
      err => this.handleError(err)
    );
  }

  private handleError(err: any, node?: boolean): void {
    if (this.errorHandler) this.errorHandler.handle(err, node);
  }

  private getNumberOfTotalDbs(): Observable<InventoryAggrCountResult[]> {
    return this.getNumberOfDbs();
  }

  private getNumberOfUnprotectedDbs(): Observable<InventoryAggrCountResult[]> {
    return this.getNumberOfDbs(false);
  }

  private getNumberOfDbs(isProtected?: boolean): Observable<InventoryAggrCountResult[]> {
    return this.inventoryService.getAggrGroupCount(
      'api/endeavour/catalog/application/database',
      'providerNodeId',
      'providerNodeId',
      this.applicationType,
      isProtected
    );
  }
}
