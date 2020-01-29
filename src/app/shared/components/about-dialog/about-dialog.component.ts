import {ViewChild, Component, EventEmitter, Input, Output, OnInit, AfterViewInit} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {SharedService} from '../../shared.service';
import {VersionService} from '../../version-info/version.service';
import {VersionModel} from '../../version-info/version.model';
import {DateFormatPipe} from 'angular2-moment';

@Component({
  selector: 'about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  providers: [VersionService]
})
export class AboutDialogComponent implements OnInit, AfterViewInit {
  @Input() logo: string; // logo path relative to IMAGES_ROOT (see the layoutPaths.images.root of theme for details)
  @Input() buildInfo: string;
  @Input() copyright: string;
  @Input() autoShow: boolean = true;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();

  @ViewChild('modal') modal: ModalDirective;

  private versionInfo: VersionModel = new VersionModel();
  private datePipe: DateFormatPipe;

  constructor(private translate: TranslateService, private versionService: VersionService) {
    this.datePipe = new DateFormatPipe();
  }

  ngOnInit() {
    let me = this;
    me.versionService.getVersion()
      .subscribe(
        data => {
          // Cast the JSON object to VersionModel instance.
          me.versionInfo = JsonConvert.deserializeObject(data, VersionModel);
          me.buildInfo = SharedService.formatString(me.buildInfo,
            me.versionInfo.version, me.versionInfo.build, this.datePipe.transform(me.versionInfo.epoch, 'll LTS'));
        },
        err => {
          me.buildInfo = SharedService.formatString(me.buildInfo,
            me.versionInfo.version, me.versionInfo.build, this.datePipe.transform(me.versionInfo.epoch, 'll LTS'));
        }
      );
    me.translate.get([
      'about.buildInfo',
      'about.copyright',
      'about.logo'])
      .subscribe((resource: Object) => {
        me.buildInfo = resource['about.buildInfo'];
        me.copyright = me.copyright || resource['about.copyright'];
      });
    me.logo = me.logo || 'app/branding/ibm/logo/SPP_128px.svg';
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  show(): void {
    let me = this;
    me.modal.show();
    me.showEvent.emit();
  }

  hide(): void {
    this.modal.hide();
    this.hideEvent.emit();
  }

  private onKeyDownEnterEsc(): void {
    this.hide();
  }
}
