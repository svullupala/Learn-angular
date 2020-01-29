import {Component, OnInit, OnDestroy} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {RestService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {SharedService} from 'shared/shared.service';
import {LinkModel} from 'shared/models/link.model';
import {CatalogResourceModel} from '../catalog-resource.model';
import {CatalogResourcesModel} from '../catalog-resources.model';
import {CatalogSearchService} from '../catalog-search.service';

@Component({
  selector: 'catalog-resource-table',
  templateUrl: './catalog-resource-table.component.html',
  styleUrls: ['./catalog-resource-table.component.scss'],
})
export class CatalogResourceTableComponent implements OnInit {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private model: PaginateModel<CatalogResourceModel>;
  private currentLink: LinkModel;
  private currentPage: number;    
  private processingRequestMsg: string;
  private textConfirm: string;
  private textExpireData: string;
  private masked: boolean = false;

  private type: string;
  private pattern: string;

  constructor(private restService: RestService,
              private translate: TranslateService,
              private searchService: CatalogSearchService) {
    let paginationId: string = `file-select-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: CatalogResourcesModel, relyOnPageLinks: false});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(item: CatalogResourceModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textExpireData, item.name),
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
      'catalog.textDeleteResource'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textExpireData = resource['catalog.textDeleteResource'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  loadData(pattern: string, type: string) {
    let me = this;

    this.pattern = pattern;
    this.type = type;
    me.onRefresh(); 
  }

  updateData(page: number, pattern: string) {
		let me = this, observable: Observable<CatalogResourcesModel>;
		me.mask();

    if (this.type === 'hypervisor') {
      observable = this.searchService.searchVms(pattern, page);
    } else {
      observable = this.searchService.searchDatabases(pattern, page);
    }

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

  getValue(): CatalogResourceModel[] {
    let me = this, results: CatalogResourceModel[] = [], records = me.model.records || [];
    records.forEach(function (jobSession) {
        if (jobSession.metadata['selected'])
          results.push(jobSession);
    });
    return results;
  }

  private onPageChange(page: number): void {
	  this.updateData(page, this.pattern);
  }

  private onRefresh(): void {
   let me = this, observable: Observable<CatalogResourcesModel>;
   me.mask();

    if (this.type === 'hypervisor') {
      observable = this.searchService.searchVms(this.pattern);
    } else {
      observable = this.searchService.searchDatabases(this.pattern);
    }

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

  private onExecuteAction(item: CatalogResourceModel, link: LinkModel): void {
    this.doAction(item, link.name);
  }

  private onDeleteFromCatalogAction(item: CatalogResourceModel): void {
    this.doAction(item, 'deletefromcatalog');
  }

  private doAction(item: CatalogResourceModel, name: string): void {
    let me = this;

    me.confirm(item, function () {
      let payload = {}, observable: Observable<CatalogResourceModel>;

      me.mask();
      observable = item.doAction<CatalogResourceModel>(CatalogResourceModel, name, payload, me.restService);
      if (observable)
        observable.subscribe(
          updated => {
            me.unmask();
            me.onRefresh();
          },
          err => {
            me.unmask();
            me.handleError(err);
          }
        );
      });
  }
}
