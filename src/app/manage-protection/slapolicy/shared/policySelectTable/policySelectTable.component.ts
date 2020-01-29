import { Component, Input, Output, OnInit, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {JsonConvert} from 'json2typescript';

import {AlertComponent} from 'shared/components';
import {SessionService} from 'core';
import {SlapoliciesModel} from '../slapolicies.model';
import {SlapolicyModel} from '../slapolicy.model';
import {SlapolicyService} from '../slapolicy.service';
import {SelectorService} from 'shared/selector/selector.service';
import {selectorFactory, SelectorType} from 'shared/selector/selector.factory';
import {BaseModel} from 'shared/models/base.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {NodeService} from 'core';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'policyselect-table',
  templateUrl: './policySelectTable.component.html',
  styleUrls: [],
  providers: [
    {provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType]},
    {provide: SelectorType, useValue: SelectorType.SIMPLE}
  ]
})
export class PolicySelectTableComponent implements OnInit, OnChanges, OnDestroy {

  @Input() selectedNames: string[];
  @Input() subType: string;
  @Output() dataLoad = new EventEmitter<Array<SlapolicyModel>>();
  disableSave: boolean = false;

  private paginateConfig: PaginateConfigModel;
  private records: Array<SlapolicyModel>;
  private recordsNotDisabled: Array<any>;
  private alert: AlertComponent;
  private errorHandler: ErrorHandlerComponent;
  private subs: Subject<void> = new Subject<void>();
  private infoTitle: string;
  private mask: boolean = false;

  constructor(private slapolicyService: SlapolicyService,
              private translateService: TranslateService,
              private selector: SelectorService<BaseModel>) {
    let paginationId: string = `policyselect-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId, pageSize: NodeService.pageSize});
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  initMetadata(retrieveSelection?: boolean): void {
    let me = this,
      records = me.records as Array<BaseModel> || [];
    records.forEach(function (item) {

      item.metadata['selected'] = retrieveSelection ? me.selector.isSelected(item) : false;

      let idx = (me.selectedNames || []).findIndex(function(name) {
          return item.name === name;
      });
      item.metadata['disabled'] = false;
      if (idx !== -1) {
        item.metadata['selected'] = true;
        me.selector.select(item);
      }
    });
  }

  loadData() {
    let me = this;
    me.mask = true;
    me.slapolicyService.getSLAPolicies(undefined, undefined, me.paginateConfig.pageStartIndex(), me.subType).
      takeUntil(me.subs).subscribe(
        data => {
          me.mask = false;
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);
          me.disableSave = !dataset.hasLink('create');
          me.records = dataset.records;
          me.paginateConfig.refresh(dataset.total);

          me.retrieveSelection();
        },
        err => {
          me.mask = false;
          me.handleError(err, true);
        },
        () => {
          me.mask = false;
          me.dataLoad.emit(me.records);
        }
      );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.translateService.get([
      'common.infoTitle'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
    });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    me.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    me.initMetadata();
    if (changes && changes['selectedNames'] && changes['selectedNames'].currentValue) {
      me.selectByNames(changes['selectedNames'].currentValue);
    }
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    me.onRefresh();
  }

  onRefresh(): void {
    this.loadData();
  }

  selectByNames(names: string[]): void {
    let me = this,
      records = me.records || [];
    records.forEach(function (item) {
      let idx = (names || []).findIndex(function(name) {
        return item.name === name;
      });
      item.metadata['selected'] = idx !== -1;
      me.onSelectChange(item);
    });
  }

  onSelectChange(item: SlapolicyModel): void {
    let me = this;
    if (item.metadata['selected'] === true) {
      me.selector.select(item);
    } else {
      me.selector.deselect(item);
    }
  }

  hasSelection(): boolean {
    return this.selector.count() > 0;
  }

  emptySelection(): void {
    this.selector.deselectAll();
    this.initMetadata();
  }

  retrieveSelection(): void {
    this.initMetadata(true);
  }

  getValue(): Array<BaseModel> {
    return this.selector.selection();
  }

  private trackByFn(index, item: SlapolicyModel): string {
    return item && item.id;
  }
}

