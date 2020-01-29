import {Component, OnInit, OnDestroy} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {Observable} from 'rxjs/Observable';
import {AlertComponent, AlertType, ErrorHandlerComponent} from 'shared/components';
import {SessionService} from 'core';
import {FileModel} from '../file.model';
import {FilesModel} from '../files.model';
import {RestService} from 'core';
import {FileCategoryModel} from '../file-category.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateModel} from 'shared/models/paginate.model';
import {FileCategoriesModel} from '../file-categories.model';
import {SharedService} from 'shared/shared.service';
import {FileVersionModel} from '../file-version.model';
import {FileVersionsModel} from '../file-versions.model';
import {FilterModel} from 'shared/models/filter.model';
import {MD5} from 'shared/util/md5';
import {LinkModel} from 'shared/models/link.model';
import {SitesModel} from 'site/sites.model';
import {SiteService} from 'site/site.service';
import {SiteModel} from 'site/site.model';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'file-select-table',
  templateUrl: './file-select-table.component.html',
  styleUrls: ['./file-select-table.component.scss'],
})

export class FileSelectTableComponent implements OnInit, OnDestroy {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private filters: Array<FilterModel>;
  private model: PaginateModel<FileModel>;
  private currentLink: LinkModel;
  private loadFilters: FilterModel[];
  private sites: Array<SiteModel> = [];
  private subs: Subject<void> = new Subject<void>();
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private masked: boolean = false;

  constructor(private restService: RestService,
              private siteService: SiteService,
              private translate: TranslateService) {
    let paginationId: string = `file-select-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: FilesModel, relyOnPageLinks: true});
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  confirm(item: FileModel, handler: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, SharedService.formatString(me.textConfirmDelete, item.name),
        AlertType.CONFIRMATION, handler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnDestroy() {
    // clean up subscriptions
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['common.textConfirmDelete'];
      });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.filters = [
      // Comment the line below when don't have usable 'filecatalog' data, just for debug.
      new FilterModel('catalogProvider', 'filecatalog'),
      new FilterModel('documentType', '*'),
      new FilterModel('unique', true)
    ];
    me.loadSites();
  }

  getSiteName(siteId: string): string {
    let site: SiteModel = (this.sites || []).find(
      (item: SiteModel) => {
        return item.id === siteId;
    });
    return site && site.name;
  }

  loadSites() {
    let me = this;
    me.siteService.getAll().takeUntil(me.subs)
      .subscribe(
        data => {
          let dataset: SitesModel;
          try {
            dataset = <SitesModel>JsonConvert.deserializeObject(data, SitesModel);
          } catch (e) {
          }
          me.sites = dataset ? dataset.records : [];
        },
        err => me.handleError(err, false)
      );
  }

  loadData(demo?: boolean, filters?: FilterModel[]) {
    let me = this, observable: Observable<FilesModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];

    me.mask();

    // Remember the load filters for later Refresh operation because
    // the "self" link returned by File Search API is incorrect.
    me.loadFilters = filters;

    observable = demo ? me.dummyDataFiles() :
      FilesModel.retrieve<FileModel, FilesModel>(FilesModel, me.restService,
        me.mergedFilters(filters), sorters, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.initLatestVersion(dataset);
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

  dummyDataFiles(): Observable<FilesModel> {
    let me = this, dataset = new FilesModel();
    dataset.total = 30;
    for (let i = 0; i < dataset.total; i++) {
      let file = new FileModel();
      file.id = 'file' + i;
      file.filename = 'file' + i;
      file.path = ((i % 3) ? 'd:\\users\\path' : '/user/path') + i;
      file.host = 'vCenter' + i;
      file.vm = 'vm' + Math.floor(Math.random() * 10);
      file.size = 12000 * (Math.floor(Math.random() * 10) + 1);
      file.catalogTime = (new Date()).valueOf() - (Math.floor(Math.random() * 10) + 1)
        * (Math.floor(Math.random() * 24) + 1) * 60 * 60 * 1000;
      file.os = (i % 3) ? 'Windows' : 'Linux';
      file.hypervisorType = ['vmware', 'hyperv'][i % 2];
      file.links = {
        self: {
          rel:  'self',
          href: `${me.restService.getBaseUrl()}api/endeavour/catalog/filecatalog/file/${file.id}`
        },
        latestversion: {
          rel:  'related',
          href: `${me.restService.getBaseUrl()}api/endeavour/catalog/filecatalog/file/${file.id}/version/latest`
        }
      };
      dataset.records.push(file);
    }
    return Observable.of(dataset).delay(1000).do(val => val);
  }

  dummyDataVersions(file: FileModel): Observable<FileVersionsModel> {
    let me = this, dataset = new FileVersionsModel();
    dataset.total = 3;
    for (let i = dataset.total; i > 0; i--) {
      let version = new FileVersionModel();
      version.protectionInfo = {};
      version.id = 'version' + i;
      version.name = 'Version ' + i;
      version.protectionTime = file.catalogTime - (dataset.total - i) * 24 * 60 * 60 * 1000;
      version.site = 'Site' + i % 2;
      version.storage = 'Server' + i % 2;
      version.hypervisorType = file.hypervisorType;
      version.links = {
        self: {
          rel:  'self',
          href: `${me.restService.getBaseUrl()}api/endeavour/catalog/filecatalog/file/${file.id}/version/${version.id}`
        }
      };
      dataset.records.push(version);
    }
    file.versions = dataset.records;
    return Observable.of(dataset).delay(1000).do(val => val);
  }

  getValue(): FileVersionModel[] {
    let me = this, versions: FileVersionModel[] = [], records = me.model.records || [];
    records.forEach(function (file) {
      (file.versions || []).forEach(function (version) {
        if (version.metadata['selected'])
          versions.push(version);
      });
      if (file.latestVersion && file.latestVersion.metadata['selected'])
        versions.push(file.latestVersion);
    });
    return versions;
  }

  private mergedFilters(searchFilters: Array<FilterModel>): Array<FilterModel> {
    let me = this;
    return (me.filters || []).concat(searchFilters || []);
  }

  private initLatestVersion(files: FilesModel): void {
    let me = this, records: Array<FileModel> = files.records || [];
    records.forEach(function (item) {
      if (item.hasLink('latestversion')) {
        item.latestVersion = me.constructLatestVersion(item);
      }
    });
  }

  private constructLatestVersion(item: FileModel): FileVersionModel {
    let version = new FileVersionModel();
    version.id = 'latest';
    version.name = '';
    version.hypervisorType = item.hypervisorType;
    version.links = {
      self: {
        rel: 'self',
        href: item.getUrl('latestversion')
      }
    };
    version.file = item;
    return version;
  }

  private loadVersions(item: FileModel, demo?: boolean): void {
    let me = this, observable: Observable<FileVersionsModel>,
      sorters = [
        new SorterModel('copyTime', 'DESC')
      ];
    if (!item.versions || item.versions.length < 1) {
      observable = demo ? me.dummyDataVersions(item) :
        item.getDataset<FileVersionModel, FileVersionsModel>(FileVersionsModel, 'copies', undefined, sorters,
          0, 0);
      if (observable)
        observable.takeUntil(me.subs).subscribe(
          dataset => {
            (dataset.records || []).forEach(function (record) {
              record.file = item;
            });
            item.versions = dataset.records;
            me.sortVersions(item);
          },
          err => me.handleError(err)
        );
    }
    me.addCollapsibleListeners(item);
  }

  private sortVersions(item: FileModel): void {
    (item.versions || []).sort(function(a: FileVersionModel, b: FileVersionModel) {
      let ct1 = a.catalogTime || 0, ct2 = b.catalogTime || 0;
      return ct1 > ct2 ? -1 : (ct1 < ct2 ? 1 : 0);
    });
  }

  private onFileVersionClick(event: any, file: FileModel, version: FileVersionModel): void {
    let target = event.target;
    if (target) {
      if (version.metadata['selected']) {
        target.checked = false;
        version.metadata['selected'] = false;
      } else {
        target.checked = true;
        version.metadata['selected'] = true;
        // (me.model.records || []).forEach(function(record) {
        //   (record.versions || []).forEach(function (item) {
        //     if (record.id !== file.id || item.id !== version.id)
        //       item.metadata['selected'] = false;
        //   });
        //   if (record.latestVersion && (record.id !== file.id || record.latestVersion.id !== version.id))
        //     record.latestVersion.metadata['selected'] = false;
        // });
        // Allow multiple selection.
        file.versions.forEach(function (item) {
          if (item.id !== version.id)
            item.metadata['selected'] = false;
        });
        if (file.latestVersion && file.latestVersion.id !== version.id)
          file.latestVersion.metadata['selected'] = false;
      }
    }
  }

  /**
   * Refresh method.
   * @param {LinkModel} link
   */
  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<FilesModel>;

    if (!ds)
      return;

    me.mask();
    observable = ds.getPageByLink<FilesModel>(FilesModel, link);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
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
      me.loadData(false, me.loadFilters);
    }
  }

  private getVersionsRadioName(item: FileModel): string {
    // TODO: Remove "|| <MD5 encoded string>" when has usable 'filecatalog' data with id field.
    // Allow multiple selection.
    return 'file-select-table-versions-radio-'
      + (item.id || MD5.encode(item.getId() + item.path + item.name + item.catalogTime));
  }

  private getCollapsibleOperatorId(item: FileModel): string {
    // TODO: Remove "|| <MD5 encoded string>" when has usable 'filecatalog' data with id field.
    return 'file-select-table-collapsible-icon-' + (item.id ||
      MD5.encode(item.getId() + item.path + item.name + item.catalogTime));
  }

  private getCollapsibleContainerId(item: FileModel): string {
    // TODO: Remove "|| <MD5 encoded string>" when has usable 'filecatalog' data with id field.
    return 'file-select-table-versions-' + (item.id ||
      MD5.encode(item.getId() + item.path + item.name + item.catalogTime));
  }

  private addCollapsibleListeners(item: FileModel): void {
    let me = this, element = jQuery('#' + me.getCollapsibleContainerId(item));
    if (element) {
      element.off('shown.bs.collapse').on('shown.bs.collapse', function () {
        me.setCollapsibleIcon(item, 'ion-chevron-right', 'ion-chevron-down');
      });
      element.off('hidden.bs.collapse').on('hidden.bs.collapse', function () {
        me.setCollapsibleIcon(item, 'ion-chevron-down', 'ion-chevron-right');
      });
    }
  }

  private setCollapsibleIcon(item: FileModel, removeClass: string, addClass: string): void {
    let element = jQuery('button > i#' + this.getCollapsibleOperatorId(item));
    if (element) {
      element.addClass(addClass);
      element.removeClass(removeClass);
    }
  }
}
