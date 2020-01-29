import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import 'rxjs/add/operator/delay';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core';
import { FileSearchOptionsComponent } from './shared/file-search-options/file-search-options.component';
import { FileRestoreOptionsComponent } from './shared/file-restore-options/file-restore-options.component';
import { FileSelectTableComponent } from './shared/file-select-table/file-select-table.component';
import { FileSearchOptionsModel } from './shared/file-search-options.model';
import { FileRestoreOptionsModel } from './shared/file-restore-options.model';
import { FileVersionModel } from './shared/file-version.model';
import { FilterModel } from 'shared/models/filter.model';
import { NodeService } from 'core';
import { FileRestoreModel } from './shared/file-restore.model';
import { SdlSearchBarComponent } from 'shared/components/sdl-search-bar/sdl-search-bar.component';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';

@Component({
  selector: 'file-restore',
  styleUrls: ['./file-restore.scss'],
  templateUrl: './file-restore.component.html'
})
export class FileRestoreComponent implements OnInit, AfterViewInit {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  @ViewChild(FileSelectTableComponent) selectTable: FileSelectTableComponent;
  @ViewChild(FileSearchOptionsComponent) searchOptions: FileSearchOptionsComponent;
  @ViewChild(FileRestoreOptionsComponent) restoreOptions: FileRestoreOptionsComponent;
  @ViewChild(SdlSearchBarComponent) searchBarComponent: SdlSearchBarComponent;
  private options: FileRestoreOptionsModel;
  private namePattern: string = '';
  private hideSearchOutput: boolean = true;
  private restoreOptionsCollapsed: boolean = true;
  private infoTitle: string;
  private warningTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textSearchFor: string;
  private textOptionsSaved: string;
  private textRestoreJobSuccessful: string;
  private textSelectAtLeastOneFileVersion: string;
  private jobServiceIds: Array<string>;
  private masked: boolean = false;

  constructor(private translate: TranslateService, private nodeService: NodeService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.warningTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'fileRestore.textSearchFor',
      'fileRestore.textOptionsSaved',
      'fileRestore.textRestoreJobSuccessful',
      'fileRestore.textSelectAtLeastOneFileVersion'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.warningTitle = resource['common.warningTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textSearchFor = resource['fileRestore.textSearchFor'];
        me.textOptionsSaved = resource['fileRestore.textOptionsSaved'];
        me.textSelectAtLeastOneFileVersion = resource['fileRestore.textSelectAtLeastOneFileVersion'];
        me.textRestoreJobSuccessful = resource['fileRestore.textRestoreJobSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.options = new FileRestoreOptionsModel(false, true, '');
    me.jobServiceIds = ['serviceprovider.recovery.file'];
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

  private get hypervisorType(): string {
    let me = this, type, selection = me.getFileVersionSelection(),
      hypervisorType = selection.length > 0 ? selection[0].hypervisorType : '';
    if (['vmware', 'hyperv'].indexOf(hypervisorType) !== -1) {
      type = hypervisorType;
    }
    return type;
  }

  private getFileVersionSelection(): FileVersionModel[] {
    let me = this, selection: FileVersionModel[];
    if (me.selectTable)
      selection = me.selectTable.getValue();
    return selection || [];
  }

  private getSearchOptions(): FileSearchOptionsModel {
    let me = this, params: FileSearchOptionsModel;
    if (me.searchOptions)
      params = me.searchOptions.getValue();
    return params;
  }

  private onOptionsClick() {
    this.restoreOptionsCollapsed = !this.restoreOptionsCollapsed;
  }

  private isValid(): boolean {
    return ((this.hasFileVersionSelection() && this.restoreOptions.isValid()) || this.masked);
  }

  private getRestoreOptions(): void {
    let me = this, options = me.restoreOptions.getValue();
    me.options = options.copy();
  }

  private hasFileVersionSelection(): boolean {
    return this.getFileVersionSelection().length > 0;
  }

  private onRestoreClick(): void {
    let me = this, selection = me.getFileVersionSelection(), observable: Observable<boolean>;

    me.getRestoreOptions();

    if (selection.length < 1) {
      me.info(me.textSelectAtLeastOneFileVersion, me.warningTitle, AlertType.WARNING);
      return;
    }

    // Construct file restore model & apply 'restorefile' action.
    me.mask();
    observable = new FileRestoreModel(selection, me.options).apply(me.nodeService);
    if (observable) {
      observable.subscribe(
        success => {
          me.unmask();
          me.info(me.textRestoreJobSuccessful, undefined, AlertType.INFO);
          me.options = new FileRestoreOptionsModel(false, true, '');
        },
        err => me.handleError(err, true),
        () => {
        }
      );
    } else {
      me.unmask();
    }
  }

  private getSearchFilters(): FilterModel[] {
    let me = this, options = me.getSearchOptions(), result: FilterModel[] = [];

    if (me.namePattern && me.namePattern.trim().length > 0)
      result.push(new FilterModel('name', me.namePattern.trim()));
    if (options.vms && options.vms.length > 0) {
      // Note: Current rest api supports search of single vm ONLY.
      result.push(new FilterModel('vmName', options.vms[0]));
    }

    if (options.dateRange && options.dateRange.length === 2) {
      let from = options.dateRange[0].setHours(0, 0, 0, 0),
        to = options.dateRange[1].setHours(23, 59, 59, 999);
      // Note: Change the property name according to the contract of File Search API.
      result.push(new FilterModel('catalogTime', from, '>='));
      result.push(new FilterModel('catalogTime', to, '<='));
    }

    if (options.osType && options.osType.length > 0) {
      // Note: Change the property name according to the contract of File Search API.
      result.push(new FilterModel('os', options.osType));
    }

    if (options.folderPath && options.folderPath.length > 0) {
      // Note: Change the property name according to the contract of File Search API.
      result.push(new FilterModel('location', options.folderPath));
    }

    return result;
  }

  private startSearch(namePattern?: string): void {
    let me = this;
    me.namePattern = namePattern;
    me.selectTable.loadData(false, me.getSearchFilters());
    me.hideSearchOutput = false;
  }
}

