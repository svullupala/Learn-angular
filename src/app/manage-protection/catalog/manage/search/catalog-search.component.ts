import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import 'rxjs/add/operator/delay';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';

import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {CatalogSearchOptionsComponent} from './catalog-search-options/catalog-search-options.component';
import {CatalogEntriesTableComponent} from './catalog-entries-table/catalog-entries-table.component';
import {CatalogSearchOptionsModel} from './catalog-search-options.model';
import {FilterModel} from 'shared/models/filter.model';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import { JobSessionModel } from 'job/shared/job-session.model';

@Component({
  selector: 'catalog-search',
  styleUrls: ['./catalog-search.scss'],
  templateUrl: './catalog-search.component.html'
})
export class CatalogSearchComponent implements OnInit, AfterViewInit {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(CatalogEntriesTableComponent) selectTable: CatalogEntriesTableComponent;
  @ViewChild(CatalogSearchOptionsComponent) searchOptions: CatalogSearchOptionsComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  private namePattern: string = '';
  private hideSearchOutput: boolean = true;
  private restoreOptionsCollapsed: boolean = true;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textSearchFor: string;
  private textSelectAtLeastOneRestorePoint: string;

  private masked: boolean = false;

  constructor(private translate: TranslateService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'catalog.textSearchFor',
      'catalog.textSelectAtLeastOneRestorePoint'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSearchFor = resource['catalog.textSearchFor'];
        me.textSelectAtLeastOneRestorePoint = resource['catalog.textSelectAtLeastOneRestorePoint'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

  }

  ngAfterViewInit() {
    this.searchBarComponent.focusSearchField();
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
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

  private getCatalogSelection(): JobSessionModel[] {
    let me = this, selection: JobSessionModel[];
    if (me.selectTable)
      selection = me.selectTable.getValue();
    return selection || [];
  }

  private getSearchOptions(): CatalogSearchOptionsModel {
    let me = this, params: CatalogSearchOptionsModel;
    if (me.searchOptions)
      params = me.searchOptions.getValue();
    return params;
  }

  private hasCatalogSelection(): boolean {
    return this.getCatalogSelection().length > 0;
  }

  private onExpireRestorePointClick(): void {
    let me = this, selection = me.getCatalogSelection(), observable: Observable<boolean>;
    // console.log('restore...selected versions length=' + selection.length);
    if (selection.length < 1) {
      me.info(me.textSelectAtLeastOneRestorePoint, me.warningTitle, AlertType.WARNING);
      return;
    }
  }

  private hasQuestionMark(value: string): boolean {
    return (value || '').indexOf('?') !== -1;
  }

  private trimEncodeString(value: string) {
    let result = value;
    if (this.hasQuestionMark(result))
      result = encodeURIComponent(result.trim());
    return result;
  }

  private getSearchFilters(): FilterModel[] {
    let me = this, options = me.getSearchOptions(), result: FilterModel[] = [];

    // console.log(`getSearchFilters....namePattern=${me.namePattern}, options=${JSON.stringify(options.json())}`);

    if (me.namePattern && me.namePattern.length > 0)
      result.push(new FilterModel('jobName', me.trimEncodeString(me.namePattern)));

    if (options.dateRange && options.dateRange.length === 2) {
      let from = options.dateRange[0].setHours(0, 0, 0, 0),
          to = options.dateRange[1].setHours(23, 59, 59, 999);
      // Note: Change the property name according to the contract of File Search API.
      result.push(new FilterModel('start', from, '>='));
      result.push(new FilterModel('start', to, '<='));
    }

    if (options.type && options.type.length > 0) {
      // Note: Change the property name according to the contract of File Search API.
      result.push(new FilterModel('serviceId', options.type));
    } else {
      // base case
      result.push(new FilterModel('serviceId', [
        'serviceprovider.protection.hypervisor',
        'serviceprovider.protection.application',
        'serviceprovider.protection.catalog'
      ], 'IN'));
    }

    if (options.subPolicyType && options.subPolicyType.length > 0) {
      result.push(new FilterModel('subPolicyType', options.subPolicyType));
    } else {
      // base case
      result.push(new FilterModel('subPolicyType', [
        'BACKUP',
        'REPLICATION',
        'SPPOFFLOAD',
        'SPPARCHIVE'
      ], 'IN'));
    }

    return result;
  }

  private startSearch(namePattern?: string): void {
    let me = this;
    me.namePattern = namePattern;
    me.selectTable.loadData(me.getSearchFilters());
    me.hideSearchOutput = false;
  }
}

