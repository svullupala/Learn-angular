import {
  Component, ElementRef, EventEmitter, OnInit, OnChanges, SimpleChanges,
  Input, Output, ViewChild
} from '@angular/core';
import {isObject} from 'rxjs/util/isObject';
import {JsonConvert} from 'json2typescript';
import {TranslateService} from '@ngx-translate/core';
import {NgUploaderOptions, UploadedFile, NgFileSelectDirective} from 'ngx-uploader';
import {ScriptModel} from '../script.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {ErrorModel} from 'shared/models/error.model';
import {LocaleService} from 'shared/locale.service';

@Component({
  selector: 'script-edit',
  styleUrls: ['./script-edit.component.scss'],
  templateUrl: './script-edit.component.html'
})

export class ScriptEditComponent implements OnInit, OnChanges {
  @Input() createUrl: string;
  @Output() onUpload = new EventEmitter<any>();
  @Output() onUploadCompleted = new EventEmitter<any>();

  private mode: string = 'list';
  private model: ScriptModel;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;

  private sizeLimit: number = 104857600; // 100MB
  private uploaderOptions: NgUploaderOptions;
  private inputUploadEvents: EventEmitter<string>;
  @ViewChild('scriptEditContainer') private editContainer: ElementRef;
  @ViewChild('scriptUploader') private scriptUploader: ElementRef;
  @ViewChild(NgFileSelectDirective) private fileSelect: NgFileSelectDirective;
  private uploadInProgress: boolean = false;
  private infoTitle: string;
  private textFileIsTooLarge: string;
  private errorTitle: string;

  private masked: boolean = false;
  private editorExpanded: boolean = false;
  private textNoFileSelected: string;

  private get textSelectedFileLabel(): string {
    if (this.fileSelect && this.fileSelect.files && this.fileSelect.files.length > 0) {
      return this.fileSelect.files[0].name;
    }
    return this.textNoFileSelected;
  }

  constructor(private translate: TranslateService) {
    this.inputUploadEvents = new EventEmitter<string>();
    this.uploaderOptions = new NgUploaderOptions({
      url: '',
      filterExtensions: false,
      autoUpload: false,
      fieldName: 'scriptFile',
      fieldReset: true,
      maxUploads: 1,
      method: 'POST',
      previewUrl: false,
      withCredentials: false,
      customHeaders: {
        'X-Endeavour-Sessionid': SessionService.getInstance().sessionId,
        'X-Endeavour-Locale': LocaleService.getCultureLang()
      },
      data: {'type': 'shell', 'fileName': ''}
    });
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
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
    if (this.scriptUploader && this.scriptUploader.nativeElement)
      this.scriptUploader.nativeElement.value = null;
  }

  reset(): void {
    this.resetFileSelect();
    this.model = new ScriptModel();
    this.mode = 'list';
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.errorTitle',
      'scripts.textFileIsTooLarge',
      'scripts.textNoFileSelected'
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.errorTitle = resource['common.errorTitle'];
      me.textFileIsTooLarge = resource['scripts.textFileIsTooLarge'];
      me.textNoFileSelected = resource['scripts.textNoFileSelected'];
    });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new ScriptModel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['createUrl'] && changes['createUrl'].currentValue) {
      me.setUploaderUrl(changes['createUrl'].currentValue);
    }
  }

  startEdit(item: ScriptModel) {
    let me = this, oldId, newId = item.id,
    link = item.getLink('edit');
    me.mode = 'edit';
    if (me.model && !me.model.phantom) {
      oldId = me.model.id;
    }
    me.resetFileSelect();
    me.model = item;

    if (link && link.href)
      me.setUploaderUrl(link.href);
  }

  private setUploaderUrl(url: string): void {
    let me = this, fileSelect = me.fileSelect;
    if (fileSelect) {
      me.uploaderOptions.url = url;
      fileSelect.uploader.opts.url = url;
    }
  }

  private startUpload() {
    this.inputUploadEvents.emit('startUpload');
  }

  private onBrowseClick() {
    if (this.scriptUploader && this.scriptUploader.nativeElement) {
      jQuery(this.scriptUploader.nativeElement).click();
    }
  }

  private onAddClick() {
    let me = this;
    me.mode = 'upload';
    if (!me.model.phantom)
      me.reset();
    else
      me.resetFileSelect();
    if (me.createUrl)
      me.setUploaderUrl(me.createUrl);
  }

  private onCancelClick() {
    this.mode = 'list';
    this.reset();
  }

  private handleUpdateFileName(event: any) {
    this.uploaderOptions.data.fileName = event.target.files[0].name;
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

  private handleUpload(data: any): void {
    let me = this;
    setTimeout(() => {
      if (me.isUploadCompleted(data)) {
        me.handleUploadCompleted(data);
        me.mode = 'list';
      } else {
        me.onUpload.emit(data);
        me.mode = 'list';
      }
    });
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

  private handleUploadCompleted(data: any): void {
    let me = this;
    me.uploadInProgress = false;

    if (!me.isUploadSuccess(data)) {
      me.handleUploadError(data);
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

  private isValid(): boolean {
    return this.hasUploadUrl() && this.hasFileSelected();
  }
}
