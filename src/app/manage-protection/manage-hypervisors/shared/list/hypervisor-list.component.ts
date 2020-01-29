import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { HypervisorModel } from 'hypervisor/shared/hypervisor.model';
import { HypervisorManageService } from 'hypervisor/shared/hypervisor-manage/hypervisor-manage.service';
import { JsonConvert } from 'json2typescript/src/json2typescript/json-convert';
import { HypervisorsModel } from 'hypervisor/shared/hypervisors.model';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';
import { SessionService } from 'core';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import { HypervisorBrowseService } from 'hypervisor/shared/hypervisor-browse.service';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { HypervisorInventoryService } from '../hypervisor-inventory.service';
import { InventoryAggrCountResult } from 'inventory/inventory.model';
import {SharedService} from 'shared/shared.service';
import {HttpErrorResponse} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'hypervisor-list',
  templateUrl: './hypervisor-list.component.html',
  styleUrls: ['./hypervisor-list.component.scss']
})
export class HypervisorListComponent implements OnInit {
  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;
  @Output() itemSelect = new EventEmitter<HypervisorModel>();
  @Output() itemEdit = new EventEmitter<HypervisorModel>();

  records: Array<HypervisorModel> = [];
  totalRecords: number = 0;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private infoTitle: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private unregistrationSucceedMsg: string;

  constructor(
    private translate: TranslateService,
    private hypervisorService: HypervisorManageService,
    private hypervisorBrowseService: HypervisorBrowseService,
    private hypervisorInventoryService: HypervisorInventoryService
  ) {}

  ngOnInit(): void {
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.loadData();

    this.translate.get([
      'common.infoTitle',
      'common.textConfirm',
      'hypervisor.textConfirmUnregister',
      'hypervisor.unregistrationSucceedMsg'
    ])
      .subscribe((resource: Object) => {
        this.infoTitle = resource['common.infoTitle'];
        this.textConfirm = resource['common.textConfirm'];
        this.textConfirmUnregister = resource['hypervisor.textConfirmUnregister'];
        this.unregistrationSucceedMsg = resource['hypervisor.unregistrationSucceedMsg'];
      });
  }

  refresh(): void {
    this.loadData();
  }

  search(value: string): Observable<BaseHypervisorModel[]> {
    // TODO: Mocked function arguments, should be changed.
    return this.hypervisorBrowseService
      .search(value, this.hypervisorType, 'hlo', 0, [], undefined, 'vm')
      .map(result => result['vms']);
  }

  onSelectSearchResult(item: BaseHypervisorModel): void {
    // TODO: Do something with selected VM/tag/folder..
  }

  onItemSelect(item: HypervisorModel): void {
    this.itemSelect.emit(item);
  }

  onItemEdit(item: HypervisorModel): void {
    this.itemEdit.emit(item);
  }

  onItemRemove(item: HypervisorModel): void {
    let me = this;
    me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmUnregister, item.name),
      AlertType.UNREGISTER, () => {
        me.hypervisorService.unregister(item).subscribe(
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

  private loadData(): void {
    const filters = [new FilterModel('type', this.hypervisorType)];
    const sorters = [new SorterModel('name', 'ASC')];

    this.hypervisorService.getAll(filters, sorters).subscribe(
      data => {
        let dataset = JsonConvert.deserializeObject(data, HypervisorsModel);

        const records = <Array<HypervisorModel>>dataset.records;
        this.totalRecords = dataset.total;

        forkJoin(this.getNumberOfTotalVms(), this.getNumberOfUnprotectedVms()).subscribe(
          ([total, unprotected]) => {
            this.records = records.map(record => {
              const totalVms = total.find(vm => vm.group === record.id);
              const unprotectedVms = unprotected.find(vm => vm.group === record.id);

              record.totalVms = totalVms && totalVms.count;
              record.unprotectedVms = unprotectedVms && unprotectedVms.count;

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

  private getNumberOfTotalVms(): Observable<InventoryAggrCountResult[]> {
    return this.getNumberOfVms();
  }

  private getNumberOfUnprotectedVms(): Observable<InventoryAggrCountResult[]> {
    return this.getNumberOfVms(false);
  }

  private getNumberOfVms(isProtected?: boolean): Observable<InventoryAggrCountResult[]> {
    return this.hypervisorInventoryService.getAggrGroupCount(
      'api/endeavour/catalog/hypervisor/vm',
      'hypervisorManagementServerID',
      'hypervisorManagementServerID',
      this.hypervisorType,
      isProtected
    );
  }
}
