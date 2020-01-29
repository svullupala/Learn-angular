import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';

import { ErrorHandlerComponent, AlertComponent, AlertType, DownloaderComponent } from 'shared/components';
import { ScriptModel } from './script.model';
import { ScriptTableComponent } from './script-table/script-table.component';
import { ScriptEditComponent } from './script-edit/script-edit.component';
import { Observable } from 'rxjs/Observable';
import { ScriptsModel } from './scripts.model';
import { Subject } from 'rxjs/Subject';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'accounts',
  templateUrl: './scripts.component.html',
})
export class ScriptsComponent implements OnInit {

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;
  filters: Array<FilterModel> = [new FilterModel('script', true)];

  @ViewChild(ScriptTableComponent) scriptTable: ScriptTableComponent;
  @ViewChild(ScriptEditComponent) scriptEdit: ScriptEditComponent;
  @ViewChild('appserverform') appserverFormContainerRef: ElementRef;
  private applicationType: String = 'script';
  private collapseSubject: Subject<boolean> = new Subject<boolean>();
  private loading: boolean = true;
  private createUrl: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;
  private textScripts: string;
  private textScriptServers: string;

  constructor(private translate: TranslateService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'scripts.textScripts',
      'scripts.textScriptServers',
      'common.textConfirmDelete'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['common.textConfirmDelete'];
        me.textScripts = resource['scripts.textScripts'];
        me.textScriptServers = resource['scripts.textScriptServers'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.downloader = SessionService.getInstance().context['downloader'];
  }

  loadData() {
    let me = this;
    if (me.scriptTable)
      me.scriptTable.loadData();
  }

  mask() {
    let me = this;
    if (me.scriptTable)
      me.scriptTable.mask();
  }

  unmask() {
    let me = this;
    if (me.scriptTable)
      me.scriptTable.unmask();
  }

  confirm(item: ScriptModel, handler: Function) {
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

  onEditClick(item: ScriptModel) {
    let me = this;
    if (me.scriptEdit)
      me.scriptEdit.startEdit(item);
  }

  onDownloadClick(item: ScriptModel) {
    let me = this, link = item.getLink('download');
    if (link && me.downloader)
      me.downloader.download(link.href);
  }

  onDeleteClick(item: ScriptModel) {
    let me = this;

    me.confirm(item, function () {
      let observable: Observable<boolean>;
      me.mask();
      observable = item.remove();
      if (observable) {
        observable.subscribe(
          () => {
            me.unmask();
            me.loadData();
          },
          err => {
            me.unmask();
            me.handleError(err);
          }
        );
      } else {
        me.unmask();
      }
    });
  }

  onScriptsLoad(dataset: ScriptsModel): void {
    let link = dataset.getLink('create');
    this.loading = false;
    this.createUrl = link ? link.href : undefined;
  }

  onUploadCompleted(): void {
    this.loadData();
  }
}
