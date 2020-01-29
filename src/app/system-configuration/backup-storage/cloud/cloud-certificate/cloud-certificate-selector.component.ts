import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { NgFileSelectDirective } from 'ngx-uploader/src/directives/ng-file-select';
import { NgUploaderOptions } from 'ngx-uploader/src/classes/ng-uploader-options.class';
import { TranslateService } from '@ngx-translate/core';
import { UploadedFile } from 'ngx-uploader/src/classes/uploaded-file.class';
import { isObject } from 'util';
import { JsonConvert } from 'json2typescript';
import { SessionService } from 'core/session.service';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { ErrorModel } from 'shared/models/error.model';
import { RestService } from 'core';
import { CertificatesModel } from './certificates.model';
import { SorterModel } from 'shared/models/sorter.model';
import { Observable } from 'rxjs/Observable';
import { CertificateModel } from './certificate.model';
import { CertificateSelectModel } from './certificate-select-model';
import { SharedService } from 'shared/shared.service';
import { CertificatesService } from '../../../certificates/certificates.service';
import { LocaleService } from 'shared/locale.service';

@Component({
  selector: 'cloud-certificate-selector',
  templateUrl: './cloud-certificate-selector.component.html',
  providers: [CertificatesService]
})

export class CloudCertificateSelectorComponent implements OnInit, OnDestroy {
  @Input() type: string;
  @Input() browseOnly: boolean = false;
  @Input() clsOfLabelCol: string;
  @Input() clsOfFieldCol: string;
  @Output() onUpload = new EventEmitter<any>();
  @Output() onUploadCompleted = new EventEmitter<any>();

  private model: CertificateSelectModel;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;

  private sizeLimit: number = 104857600; // 100MB
  private uploaderOptions: NgUploaderOptions;
  private subs: Subject<void> = new Subject<void>();
  private inputUploadEvents: EventEmitter<string>;
  @ViewChild('uploader') private uploader: ElementRef;
  @ViewChild(NgFileSelectDirective) private fileSelect: NgFileSelectDirective;
  private certificates: Array<CertificateModel>;
  private uploadInProgress: boolean = false;
  private infoTitle: string;
  private textFileIsTooLarge: string;
  private errorTitle: string;
  private UPLOAD_TYPE: string = 'upload';
  private CUT_AND_PASTE_TYPE: string = 'cutandpaste';
  private EXISTING_TYPE: string = 'existing';

  private textNoCertificateSelected: string;

  private get textSelectedFileLabel(): string {
    if (this.fileSelect && this.fileSelect.files && this.fileSelect.files.length > 0) {
      return SharedService.ellipsisPath(this.fileSelect.files[0].name, 15);
    }
    return this.textNoCertificateSelected;
  }

  private get fileToolTip(): string {
    if (this.fileSelect && this.fileSelect.files && this.fileSelect.files.length > 0) {
      return this.fileSelect.files[0].name;
    }
  }

  constructor(private translate: TranslateService,
              private certificateService: CertificatesService,
              private rest: RestService) {
    this.inputUploadEvents = new EventEmitter<string>();
    this.uploaderOptions = new NgUploaderOptions({
      url: '',
      filterExtensions: false,
      autoUpload: false,
      fieldName: 'crtFile',
      fieldReset: true,
      maxUploads: 1,
      method: 'POST',
      withCredentials: false,
      customHeaders: {
        'X-Endeavour-Sessionid': SessionService.getInstance().sessionId,
        'X-Endeavour-Locale': LocaleService.getCultureLang()
      },
      data: {type: '', name: ''}
    });
  }


  info(message: string, title?: string, type?) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message, type);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  resetFileSelect(): void {
    if (this.uploader && this.uploader.nativeElement)
      this.uploader.nativeElement.value = null;
  }

  reset(): void {
    this.resetFileSelect();
    this.model = new CertificateSelectModel();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.errorTitle',
      'scripts.textFileIsTooLarge',
      'cloud.textNoCertificateSelected'
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.errorTitle = resource['common.errorTitle'];
      me.textFileIsTooLarge = resource['scripts.textFileIsTooLarge'];
      me.textNoCertificateSelected = resource['cloud.textNoCertificateSelected'];
    });
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    // if (!me.browseOnly)
    me.getCertificates();
    me.model = new CertificateSelectModel();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public startUpload() {
    if (this.model && this.model.method === this.UPLOAD_TYPE) {
      this.setFormData(this.fileSelect.files[0].name, this.type);
      this.setOptions(this.uploaderOptions);
      this.inputUploadEvents.emit('startUpload');
    } else if (this.model && this.model.method === this.CUT_AND_PASTE_TYPE) {
      this.model.certificateType = this.type;
      this.certificateService.create(this.model).takeUntil(this.subs).
        subscribe(
        (model: CertificateModel) => {
          this.getCertificates(true, undefined, model);
        },
        (err) => this.handleError(err)
      );
    }
  }

  public getCertificates(setExisting: boolean = false, data?: UploadedFile, model?: CertificateModel): void {
    let me = this, observable: Observable<CertificatesModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];
    observable = CertificatesModel.retrieve<CertificateModel, CertificatesModel>(CertificatesModel, me.rest,
      [], sorters, 0, RestService.pageSize);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        (dataset: CertificatesModel) => {
          me.certificates = dataset.records;
          me.uploaderOptions.url = dataset.getUrl('create');
          me.setOptions(me.uploaderOptions);
          if (setExisting && (data || model)) {
            setTimeout(() => {
              me.model.certificate = model ? model.url : me.handleSuccess(data);
              me.model.method = me.EXISTING_TYPE;
            }, 100);
          }
        },
        err => me.handleError(err)
      );
    }
  }

  public setFormData(name: string, type: string): void {
    this.uploaderOptions.data = {
      name: name,
      type: type
    };
  }

  public hasCertificate(): boolean {
    return this.model && this.model.certificate !== undefined;
  }

  public getCertificate(): string {
    return this.model && this.model.certificate;
  }

  public resetCertificate(): void {
    this.model = new CertificateSelectModel();
  }

  public setCertificate(href: string): void {
    if (href) {
      this.model.method = this.EXISTING_TYPE;
      this.model.certificate = href;
    }
  }

  public isValid(): boolean {
    if (this.model.method === this.UPLOAD_TYPE) {
      return this.hasUploadUrl() && this.hasFileSelected();
    } else if (this.model.method === this.CUT_AND_PASTE_TYPE) {
      return this.hasUploadUrl() && this.model
        && this.model.certificateString && this.model.certificateString.length > 0
        && this.model.certificateName && this.model.certificateName.length > 0;
    }
  }

  public setOptions(options: NgUploaderOptions): void {
    this.fileSelect.uploader.setOptions(options);
  }

  private onBrowseClick() {
    if (this.uploader && this.uploader.nativeElement) {
      jQuery(this.uploader.nativeElement).click();
    }
  }

  private beforeUpload(uploadingFile: UploadedFile): void {
    if (uploadingFile.size > this.sizeLimit) {
      uploadingFile.setAbort();
      this.info(this.textFileIsTooLarge, this.errorTitle, AlertType.ERROR);
      return;
    }

    if (!this.hasUploadUrl()) {
      uploadingFile.setAbort();
    } else {
      this.uploadInProgress = true;
    }
  }

  private handleUpload(data: UploadedFile): void {
    let me = this;
    if (me.isUploadCompleted(data)) {
      setTimeout(() => {
        me.handleUploadCompleted(data);
      }, 100);
    }
  }

  private isUploadCompleted(file: UploadedFile): boolean {
    return file && (file.done || file.abort || file.error);
  }

  private isUploadSuccess(file: UploadedFile): boolean {
    return file && file.status >= 200 && file.status <= 299;
  }

  private handleUploadError(file: UploadedFile): void {
    let me = this, response, error: ErrorModel;
    if (file) {
      if (file.response) {
        response = JSON.parse(file.response);

        if (isObject(response)) {
          try {
            error = JsonConvert.deserializeObject(response, ErrorModel);
          } catch (e) {
          }
          if (error)
            me.info(error.message, me.errorTitle, AlertType.ERROR);
        }
      } else {
        me.info(file.statusText, me.errorTitle, AlertType.ERROR);
      }
    }
  }

  private handleSuccess(file: UploadedFile): string {
    let me = this, response, model: CertificateModel, url: string;
    if (file) {
      if (file.response) {
        response = JSON.parse(file.response);
        if (isObject(response)) {
          try {
            model = JsonConvert.deserializeObject(response, CertificateModel);
            url = model.url;
          } catch (e) {
          }
        }
      }
    }
    return url;
  }

  private handleUploadCompleted(data: any): void {
    let me = this;
    me.uploadInProgress = false;
    if (!me.isUploadSuccess(data)) {
      me.handleUploadError(data);
    } else if (!me.browseOnly && me.isUploadSuccess(data)) {
      me.getCertificates(true, data);
    }
    me.onUploadCompleted.emit(data);
  }

  private hasUploadUrl(): boolean {
    return this.uploaderOptions && !!this.uploaderOptions.url;
  }

  private canAdd(): boolean {
    return this.hasUploadUrl();
  }

  private hasFileSelected(): boolean {
    return this.fileSelect && this.fileSelect.files && this.fileSelect.files.length > 0;
  }
}
