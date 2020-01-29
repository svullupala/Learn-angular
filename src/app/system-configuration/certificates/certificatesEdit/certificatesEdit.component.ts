import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs/Subject';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {CertificateModel} from '../certificate.model';
import {CertificatesService} from '../certificates.service';
import {CloudCertificateSelectorComponent}
  from 'cloud/cloud-certificate/cloud-certificate-selector.component';

@Component({
  selector: 'certificates-edit',
  templateUrl: './certificatesEdit.component.html'
})

export class CertificatesEditComponent implements OnInit, OnDestroy {
  @ViewChild('certificatesEditContainer') editContainer: ElementRef;
  @ViewChild(CloudCertificateSelectorComponent) cloudCertificateSelector: CloudCertificateSelectorComponent;

  @Output() saveClick = new EventEmitter();
  @Output() cancelClick = new EventEmitter();
  @Input() disableAddCertificates: boolean = false;

  model: CertificateModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();
  selectedCloudType: string;
  cloudTypes: [string] = ['aws', 'sp', 'cos'];

  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSuccess: string;
  private textEditSuccess: string;
  private textConfirm: string;
  private collapseSub: Subject<boolean> = new Subject<boolean>();
  private masked: boolean = false;

  constructor(private certificatesService: CertificatesService,
              private translate: TranslateService) {
  }

  public collapseRegistrationForm(collapsed: boolean): void {
    this.collapseSub.next(collapsed);
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  reset(collapse?: boolean): void {
    this.model = new CertificateModel();
    if (collapse)
      this.collapseRegistrationForm(true);
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'certificates.textCreationSuccessful',
      'certificates.textEditSuccessful'
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSuccess = resource['certificates.textCreationSuccessful'];
        me.textEditSuccess = resource['certificates.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new CertificateModel();
  }

  ngOnDestroy() {
    this.collapseSub.unsubscribe();
  }

  onAddClick() {
    let me = this;
    if (!me.model.phantom)
      me.reset();
  }

  onSaveClick() {
    let me = this;
    me.cloudCertificateSelector.startUpload();
    me.saveClick.emit();
  }

  onCancelClick() {
    let me = this;
    me.reset();
    me.cancelClick.emit();
  }

  startEdit(item: CertificateModel) {
    let me = this;
    me.model = item;
    me.collapseRegistrationForm(false);
  }

  private isValid(): boolean {
    return this.cloudCertificateSelector.isValid() && !!this.selectedCloudType;
  }
}
