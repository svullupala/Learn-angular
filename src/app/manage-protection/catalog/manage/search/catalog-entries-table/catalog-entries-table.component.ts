import {Component, OnInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {CatalogModel} from '../../catalog.model';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {SharedService} from 'shared/shared.service';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import { JobSessionModel } from 'job/shared/job-session.model';
import { JobSessionsModel } from 'job/shared/job-sessions.model';
import {MD5} from 'shared/util/md5';

@Component({
  selector: 'catalog-entries-table',
  templateUrl: './catalog-entries-table.component.html',
  styleUrls: ['./catalog-entries-table.component.scss'],
})
export class CatalogEntriesTableComponent implements OnInit {
  @ViewChild('scrollableTable') private scrollableTable: ElementRef;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private filters: Array<FilterModel>;
  private model: PaginateModel<JobSessionModel>;
  private currentLink: LinkModel;
  private loadFilters: FilterModel[];
  private processingRequestMsg: string;
  private textConfirm: string;
  private textExpireData: string;
  private textExpireDataAll: string;
  private masked: boolean = false;
  private isTopDropdown: boolean = false;

  constructor(private restService: RestService,
              private translate: TranslateService) {
    let paginationId: string = `file-select-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: JobSessionsModel, relyOnPageLinks: true});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(item: JobSessionModel, handler: Function, allSessions?: boolean) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString((allSessions) ? me.textExpireDataAll : me.textExpireData, item.jobName),
        AlertType.DANGEROK, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'catalog.textExpireData',
      'catalog.textExpireDataAll'
      ]).subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textExpireData = resource['catalog.textExpireData'];
        me.textExpireDataAll = resource['catalog.textExpireDataAll'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.filters = [
      new FilterModel('hasCatalog', 'true')
    ];
  }

  loadData(filters?: FilterModel[]) {
    let me = this, observable: Observable<JobSessionsModel>,
      sorters = [
        new SorterModel('start', 'DESC')
      ];

    me.mask();

    // Remember the load filters for later Refresh operation because
    // the "self" link returned by File Search API is incorrect.
    me.loadFilters = filters;

    observable =
      JobSessionsModel.retrieve<JobSessionModel, JobSessionsModel>(JobSessionsModel, me.restService,
        me.mergedFilters(filters), sorters, 0);

    if (observable) {
      observable.subscribe(
        dataset => {

          me.model.reset();
          me.model.update(dataset);
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  getValue(): JobSessionModel[] {
    let me = this, results: JobSessionModel[] = [], records = me.model.records || [];
    records.forEach(function (jobSession) {
        if (jobSession.metadata['selected'])
          results.push(jobSession);
    });
    return results;
  }

  private mergedFilters(searchFilters: Array<FilterModel>): Array<FilterModel> {
    let me = this;
    return (me.filters || []).concat(searchFilters || []);
  }

  /**
   * Refresh method.
   * @param {LinkModel} link
   */
  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<JobSessionsModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<JobSessionsModel>(JobSessionsModel, link);
    if (observable) {
      observable.subscribe(
        dataset => {
          me.model.update(dataset);
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private onPageChange(param: { page: number, link: LinkModel }): void {
    // Remember the link for later Refresh operation because the "self" link returned by File Search API is incorrect.
    this.currentLink = param.link;
    this.unmask();
  }

  private onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.loadData(me.loadFilters);
    }
  }

  private getOffset(item: JobSessionModel) {
    let element = this.scrollableTable.nativeElement;
    this.isTopDropdown =
    document.getElementById( 'line-' + this.getDropDownActionId(item) ).offsetTop - element.scrollTop > 150;
  }

  private onExecuteAction(item: JobSessionModel, link: LinkModel, id: string): void {    
    this.doAction(item, link.name);
  }

  // private refreshDisplayFields(target: JobSessionModel, updated: JobSessionModel): void {
  //   target.name = updated.name;
  //   target.catalogTime = updated.catalogTime;
  //   target.links = updated.links;
  // }

  private doAction(item: JobSessionModel, name: string): void {
    let me = this;
    me.confirm(item, function () {
      let payload = {}, observable: Observable<JobSessionModel>;

      me.mask();
      observable = item.doAction<JobSessionModel>(JobSessionModel, name, payload, me.restService);
      if (observable)
        observable.subscribe(
          updated => {
            me.unmask();
            me.onRefresh();
              // if (updated)
              //   me.refreshDisplayFields(item, updated);
          },
          err => {
            me.unmask();
            me.handleError(err);
          }
        );
      }, (name === 'expireall'));
  }

  private getDropDownActionId(item: JobSessionModel): string {
    return 'catalog-entries-table-dropdown-action-' + MD5.encode(item.getId());
  }
}
