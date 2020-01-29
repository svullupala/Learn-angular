import {Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, AfterViewInit} from '@angular/core';
import {GlobalState} from '../global.state';
import {TranslateService} from '@ngx-translate/core';
import {RouterExtService} from 'shared/router-ext.service';
import {VersionService} from 'shared/version-info/version.service';
import {VersionModel} from 'shared/version-info/version.model';
import {JsonConvert} from 'json2typescript';
import {DynaCompService} from 'shared/dynacomp.service';
import {Version_10_1_4Component} from './versions/version-10-1-4.component';
import {Version_10_1_5Component} from './versions/version-10-1-5.component';
import {Version_10_1_6Component} from './versions/version-10-1-6.component';

@Component({
  selector: 'whats-new',
  styleUrls: ['./whatsnew.component.scss'],
  templateUrl: './whatsnew.component.html',
})
export class WhatsNewComponent implements OnInit, AfterViewInit {
  @ViewChild('versioncontainer', {read: ViewContainerRef}) versionContainer: ViewContainerRef;
  selectedVersion: number = 0;

  private versions: Array<any> = [
    {component: Version_10_1_6Component, data: {id: '10.1.6'}},
    {component: Version_10_1_5Component, data: {id: '10.1.5'}},
    {component: Version_10_1_4Component, data: {id: '10.1.4'}}
  ];

  private textWhatsNewTitle: string = '';
  private textVersion: string = '';
  private compService: DynaCompService;

  private versionInfo: VersionModel = new VersionModel();
  private buildInfo: string;

  constructor(private _state: GlobalState,
              private translate: TranslateService,
              private routerExt: RouterExtService,
              private componentFactoryResolver: ComponentFactoryResolver,
              private versionService: VersionService) {
  }

  ngOnInit(): void {
    let me = this;
    me.versionService.getVersion()
      .subscribe(
        data => {
          // Cast the JSON object to VersionModel instance.
          me.versionInfo = JsonConvert.deserializeObject(data, VersionModel);
          me.buildInfo = me.versionInfo.version;
        },
        err => {
          me.buildInfo = me.versionInfo.version;
        }
      );
    me.translate.get([
      'common.textWhatsNew',
      'whatsNew.textVersion'
    ])
      .subscribe((resource: Object) => {
        me.textWhatsNewTitle = resource['common.textWhatsNew'];
        me.textVersion = resource['whatsNew.textVersion'];
        me._state.notifyDataChanged('main.alcontent',
          {
            full: true,
            backgroundColor: '#1D364D',
            fontColor: '#C0BFC0',
            title: me.textWhatsNewTitle,
            url: me.routerExt.getPreviousUrl()
          }
        );
      });

    me.initDynaCompService();
  }

  ngAfterViewInit(): void {
    let me = this;
    me.loadVersion(this.selectedVersion);
  }

  ngOnDestroy(): void {
    let me = this;
    me._state.notifyDataChanged('main.alcontent', {full: false});
  }

  onSelectVersion(): void {
    this.loadVersion(this.selectedVersion);
  }

  private loadVersion(version: number): void {
    setTimeout(()=>{
      this.compService.loadDynaCompByIndex(version, this.versionContainer);
      }, 1);
  }

  private initDynaCompService(): void {
    this.compService = new DynaCompService(this.componentFactoryResolver);
    this.compService.setDynaComps(this.versions);
  }
}

export class VersionMap {
  constructor(public display: string, public value: string) {
  }
}
