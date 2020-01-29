import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {JsonConvert} from 'json2typescript';

import {AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {SiteModel} from '../site.model';
import {SitesModel} from '../sites.model';
import {SiteService} from '../site.service';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {SorterModel} from 'shared/models/sorter.model';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'sites-table',
  styleUrls: ['sitesTable.component.scss'],
  templateUrl: './sitesTable.component.html'
})

export class SitesTableComponent implements OnInit, Sortable {

  @Output() deleteClick = new EventEmitter<SiteModel>();
  @Output() editClick = new EventEmitter<SiteModel>();

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  disableAddSite: boolean = false;

  private sitesTableData: Array<SiteModel>;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;

  private textSunday: string;
  private textMonday: string;
  private textTuesday: string;
  private textWednesday: string;
  private textThursday: string;
  private textFriday: string;
  private textSaturday: string;
  private textBytes: string;
  private textKilobytes: string;
  private textMegabytes: string;
  private textGigabytes: string;

  constructor(private siteService: SiteService, private translate: TranslateService) {
    let paginationId: string = `site-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];
    me.translate.get([
        'common.textBytesPerSec',
        'common.textKilobytesPerSec',
        'common.textMegabytesPerSec',
        'common.textGigabytesPerSec',
      ]).subscribe((resource) => {
        me.textBytes = resource['common.textBytesPerSec'];
        me.textKilobytes = resource['common.textKilobytesPerSec'];
        me.textMegabytes = resource['common.textMegabytesPerSec'];
        me.textGigabytes = resource['common.textGigabytesPerSec'];
      });
    me.loadData();
  }

  loadData() {
    let me = this;
    me.siteService.getSites(me.sorters)
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, SitesModel);

          for(let i=0; i<dataset.records.length; i++) {
            if(dataset.records[i].throttles && dataset.records[i].throttles[0]) {
              if(dataset.records[i].throttles[0].rate) 
              dataset.records[i]['throttleRate'] = this.getThrottleRateDisplay(dataset.records[i].throttles[0].rate);
            }           
          }
                  
          me.disableAddSite = !dataset.hasLink('create');
          me.sitesTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.paginateConfig.itemsPerPage = dataset.total || 1;
        },
        err => me.handleError(err),
      );
  }

  getThrottleRateDisplay(rate: string) {
    var rateDisplay;

    var value = Number(rate);
      if (value < 1024) {
        rateDisplay = value + ' ' + this.textBytes;
      } else if (value < 1048576) {
        rateDisplay = (Math.round((value * 10) / 1024) / 10) + ' ' + this.textKilobytes;
      } else if (value < 1073741824) {
        rateDisplay = (Math.round((value * 10) / 1048576) / 10) + ' ' + this.textMegabytes;
      } else if (value < 1099511627776) {
        rateDisplay = (Math.round((value * 10 ) / 1073741824) / 10) + ' ' + this.textGigabytes;
      }
  
    return rateDisplay;
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onRefresh(): void {
    this.loadData();
  }

  onEditClick(item: SiteModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: SiteModel) {
    this.deleteClick.emit(item);
  }

  canDelete(item: SiteModel) {
    return item.hasLink('delete');
  }

  canEdit(item: SiteModel) {
    return item.hasLink('edit');
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  onSort(name: string): void {
    this.changeSorter(name);
    SortUtil.toggle(this.sorters, name);
    this.onRefresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    }
  }
}
