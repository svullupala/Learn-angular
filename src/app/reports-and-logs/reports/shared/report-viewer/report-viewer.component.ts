import {Component, OnInit, Input, Output, EventEmitter, ElementRef, AfterViewInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';

import {AlertComponent, AlertType, ErrorHandlerComponent, DownloaderComponent} from 'shared/components';
import {SessionService} from 'core';
import {RestService} from 'core';
import {ReportInstanceModel} from '../report-instance.model';
import {SharedService} from 'shared/shared.service';
import {LinkModel} from 'shared/models/link.model';
import {productionMode} from '../../../../environment';
import {ENTER} from '@angular/cdk/keycodes';
import {ReportsService} from 'reports/shared/reports.service';

@Component({
  selector: 'report-viewer',
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.scss'],
})

export class ReportViewerComponent implements OnInit, AfterViewInit {

  @Input() instance: ReportInstanceModel;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  downloader: DownloaderComponent;

  private downloadLinks: Array<LinkModel>;
  private viewSrcUrl: any;
  private textFormatTpl: any;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textConfirmDelete: string;

  constructor(private restService: RestService,
              private translate: TranslateService,
              private sanitizer: DomSanitizer,
              private element: ElementRef,
              private reportsService: ReportsService) {
  }

  confirm(item: ReportInstanceModel, handler: Function) {
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

  ngOnInit() {
    let me = this;
    me.translate.get([
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.textConfirmDelete',
      'reports.textFormatTpl'])
      .subscribe((resource: Object) => {
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmDelete = resource['common.textConfirmDelete'];
        me.textFormatTpl = resource['reports.textFormatTpl'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.downloader = SessionService.getInstance().context['downloader'];
    me.loadData();
  }

  ngAfterViewInit(): void {
    this.addReportIFrameLoadListener();
  }

  loadData(instance?: ReportInstanceModel) {
    let me = this, link: LinkModel, url;

    me.instance = instance || me.instance;
    link = me.instance ? me.instance.getLink('view') : null;
    if (link) {
      url = link.href;
    } else {
      url = 'about:blank';
    }
    me.viewSrcUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.reportsService.disableLoadingStatus();

    me.downloadLinks = me.instance ? me.instance.getDownloadLinks() : [];
  }

  addReportIFrameLoadListener(): void {
    let me = this, iFrame = me.getReportIFrame();
    if (iFrame) {
      iFrame.off('load').on('load', function () {
        me.handleReportIFrameLoad();
      });
    }
  }

  private handleReportIFrameLoad(): void {
    let me = this, doc = me.getReportIFrameDocument(), cells = doc ? doc.find('td.details-control') : null;
    if (cells && cells.length > 0) {
      cells.attr('tabindex', '0');
      cells.off('keydown').keydown(function (event) {
        let target: any = event ? event.target : null;
        if (target && event.keyCode === ENTER) {
          me.invokeClick(target);
        }
      });
    }
  }

  private getReportIFrame(): any {
    return jQuery(this.element.nativeElement).find('iframe.report');
  }

  private getReportIFrameDocument(): any {
    let result = null;
    try {
      result = jQuery(window.frames['reportViewerIframe'].document);
    } catch (e) {
      console.log(e.message);
    }
    return result;
  }

  private invokeElementMethod(renderElement: any, methodName: string, args?: any[]): void {
    ((renderElement))[methodName].apply(renderElement, args);
  }

  private invokeClick(el: HTMLElement): void {
    if (el)
      this.invokeElementMethod(el, 'click');
  }

  private onDownloadClick(link: LinkModel): void {
    let me = this;
    if (me.downloader)
      me.downloader.download(link.href);
  }

  private getDownloadFormatText(formatName: string): string {
    return formatName && SharedService.formatString(this.textFormatTpl, formatName);
  }
}
