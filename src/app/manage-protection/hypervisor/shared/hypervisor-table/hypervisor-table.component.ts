import {Component, Input, OnInit, OnDestroy, EventEmitter, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SharedService} from 'shared/shared.service';
import {HypervisorModel} from '../hypervisor.model';
import {HypervisorsModel} from '../hypervisors.model';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {LinkModel} from 'shared/models/link.model';
import {Subject} from 'rxjs/Subject';
import {MD5} from 'shared/util/md5';
import {HypervisorManageService} from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';

@Component({
  selector: 'hypervisor-table',
  templateUrl: './hypervisor-table.component.html',
  styleUrls: ['./hypervisor-table.component.scss'],
})
export class HypervisorTableComponent implements OnInit, OnDestroy {

  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Output() editClickEvent: EventEmitter<HypervisorModel> = new EventEmitter<HypervisorModel>();
  @Output() resetEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadedEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  records: Array<HypervisorModel>;
  paginateConfig: PaginateConfigModel;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  model: HypervisorModel;
  canCreate: boolean = false;
  private subs: Subject<void> = new Subject<void>();
  private infoTitle: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;

  private masked: boolean = false;
  private resource: Object = [];

  constructor(public hypervisorManageService: HypervisorManageService,
              public translate: TranslateService) {

    let paginationId: string = `hypervisor-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  confirm(item: HypervisorModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
        AlertType.UNREGISTER, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onEditClick(item: HypervisorModel) {
    let me = this;
    this.editClickEvent.emit(item);
  }

  reset(): void {
    let me = this;
    me.resetEvent.emit();
  }

  onDeleteClick(item: HypervisorModel) {
    let me = this;

    me.confirm(item, function () {
      me.masked = true;
      me.hypervisorManageService.unregister(item).takeUntil(me.subs)
        .subscribe(
          () => {
            me.masked = false;
            me.loadData();
            if (me.model.id !== undefined && me.model.equals(item)) {
              me.reset();
            }
          },
          err => {
            me.masked = false;
            me.handleError(err);
          }
        );
    });
  }

  loadData(resetPage: boolean = true) {
    let me = this;
    if (resetPage)
      me.paginateConfig.reset();

    me.masked = true;
    me.hypervisorManageService.getAll(me.filters, me.sorters, undefined,
      me.paginateConfig.pageStartIndex()).takeUntil(me.subs)
      .subscribe(
        data => {
          // Cast the JSON object to HypervisorsModel instance.
          me.masked = false;
          let dataset = JsonConvert.deserializeObject(data, HypervisorsModel);
          me.records = <Array<HypervisorModel>> dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.canCreate = dataset.getLink('create') !== undefined;
          me.loadedEvent.emit(me.canCreate);
        },
        err => {
          me.masked = false;
          me.handleError(err);
        }
      );
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    this.loadData(false);
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.filters = [
      new FilterModel('type', me.hypervisorType)
    ];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'common.infoTitle',
      'common.textConfirm',
      'hypervisor.textConfirmUnregister',
      'vmware.textHostName',
      'hyperv.textHostName']).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.resource = resource;
        me.infoTitle = resource['common.infoTitle'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmUnregister = resource['hypervisor.textConfirmUnregister'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new HypervisorModel(me.hypervisorType);
    me.loadData();
  }

  private getHostNameText(): string {
    if (this.isHyperV()) {
      return this.resource['hyperv.textHostName'];
    } else if (this.isVMware()) {
      return this.resource['vmware.textHostName'];
    } else {
      return 'add';
    }
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private isVMware(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_VMWARE;
  }

  private onExecuteAction(item: HypervisorModel, link: LinkModel): void {
    this.doAction(item, link.name);
  }

  private refreshDisplayFields(target: HypervisorModel, updated: HypervisorModel): void {
    target.name = updated.name;
    target.hostAddress = updated.hostAddress;
    target.links = updated.links;
  }

  private doAction(item: HypervisorModel, name: string): void {
    let me = this, payload = {},
      observable = item.doAction<HypervisorModel>(HypervisorModel, name, payload, me.hypervisorManageService.proxy);
    if (observable)
      observable.takeUntil(me.subs).subscribe(
        updated => {
          if (updated)
            me.refreshDisplayFields(item, updated);
        },
        err => me.handleError(err)
      );
  }

  private getDropDownActionId(item: HypervisorModel): string {
    return 'hypervisor-manage-dropdown-action-' + MD5.encode(item.getId());
  }
}
