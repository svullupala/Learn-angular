import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import 'rxjs/add/operator/delay';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';

import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {CatalogResourceTableComponent} from './catalog-resource-table/catalog-resource-table.component';
import {FilterModel} from 'shared/models/filter.model';
import {SdlSearchBarComponent} from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import {CatalogResourceModel} from './catalog-resource.model';
import {CatalogSearchService} from './catalog-search.service';

@Component({
  selector: 'catalog-resource',
  styleUrls: ['./catalog-resource.scss'],
  templateUrl: './catalog-resource.component.html'
})
export class CatalogResourceComponent implements OnInit, AfterViewInit {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(CatalogResourceTableComponent) selectTable: CatalogResourceTableComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  private namePattern: string = '';
  private hideSearchOutput: boolean = true;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textSearchFor: string;
  private types: string[] = ['application', 'hypervisor'];
  private selectType: any = this.types[0];

  private masked: boolean = false;

  constructor(private translate: TranslateService, private searchService: CatalogSearchService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'catalog.textSearchForResource'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSearchFor = resource['catalog.textSearchForResource'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

  }

  ngAfterViewInit() { }

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

  private getCatalogSelection(): CatalogResourceModel[] {
    let me = this, selection: CatalogResourceModel[];
    if (me.selectTable)
      selection = me.selectTable.getValue();
    return selection || [];
  }

  private hasCatalogSelection(): boolean {
    return this.getCatalogSelection().length > 0;
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

  private startSearch(namePattern?: string): void {
    let me = this;
    me.namePattern = namePattern;

    me.selectTable.loadData(namePattern, this.selectType);
    me.hideSearchOutput = false;
  }
}

