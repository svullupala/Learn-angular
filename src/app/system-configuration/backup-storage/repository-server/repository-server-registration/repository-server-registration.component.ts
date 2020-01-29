import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core/session.service';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { CloudCertificateSelectorComponent } from 'cloud/cloud-certificate/cloud-certificate-selector.component';
import { CloudSchemaComponent } from 'cloud/cloud-schema/cloud-schema.component';
import { CloudSchemaModel } from 'cloud/cloud-schema.model';
import { CloudService } from 'cloud/cloud.service';
import { SharedService } from 'shared/shared.service';
import { CloudModel } from 'cloud/cloud.model';
import { KeySelectModel } from '../../../../shared/components/key-selector/key-select.model';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'repository-server-registration',
  templateUrl: './repository-server-registration.component.html'
})

export class RepositoryServerRegistrationComponent implements OnInit {
  @Input() hideRegistration: boolean = false;
  @Output() onSuccessfulRegister: EventEmitter<void> = new EventEmitter<void>();
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private subs: Subject<void> = new Subject<void>();
  @ViewChild('cloudcontainer') private editContainer: ElementRef;
  @ViewChild(CloudSchemaComponent) private cloudSchemaComponent: CloudSchemaComponent;
  @ViewChild(CloudCertificateSelectorComponent) private cloudCertificateComponent: CloudCertificateSelectorComponent;
  private selectedCloudSchema: CloudSchemaModel;
  private updateCloud: CloudModel;
  private maskedContainer: boolean = false;
  private textRepositorySucceedRegisterTpl: string;
  private textRepositoryUpdateSucceedRegisterTpl: string;
  private infoTitle: string;
  private errorTitle: string;
  private editMode = false;

  constructor(private translate: TranslateService, private cloudService: CloudService) {}

  mask() {
    let me = this;
    if (me.alert) {
      me.alert.show(undefined, undefined, AlertType.MASK);
    }
  }

  unmask() {
    let me = this;
    if (me.alert) {
      me.alert.hide();
    }
  }

  maskContainer(): void {
    this.maskedContainer = true;
  }

  unmaskContainer(): void {
    this.maskedContainer = false;
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

  reset(): void {
    this.editMode = false;
    this.resetForm();
    this.resetCertificate();
    this.resetKeyModel();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.errorTitle',
      'repositoryserver.textRepositoryUpdateSucceedRegisterTpl',
      'repositoryserver.textRepositorySucceedRegisterTpl'
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.errorTitle = resource['common.errorTitle'];
      me.textRepositorySucceedRegisterTpl = resource['repositoryserver.textRepositorySucceedRegisterTpl'];
      me.textRepositoryUpdateSucceedRegisterTpl = resource['repositoryserver.textRepositoryUpdateSucceedRegisterTpl'];
    });

    me.onGetSpSchema();
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  public canRegister(): boolean {
    return this.isValid();
  }

  public setCloud(cloud: CloudModel): void {
    if (cloud) {
      this.editMode = true;
      this.updateCloud = cloud;
      this.cloudSchemaComponent.updateSchemaForm(cloud);
      this.setKeyModel(cloud.accesskey ? cloud.accesskey.href : '');
      this.selectedCloudSchema.certificateHref = cloud.properties && cloud.properties.certificate
        ? cloud.properties.certificate['href']
        : '';
      this.setCertificate(this.selectedCloudSchema.certificateHref);
    }
  }

  public onRegisterCloudProvider(): void {
    let observable: Observable<CloudModel>, tpl: string;
    this.mask();
    this.selectedCloudSchema.accessPayload = this.getAccessKeyPayload();
    this.selectedCloudSchema.certificateHref = this.getCertificateHref();
    observable = this.editMode
        ? this.cloudService.updateCloudProvider(this.updateCloud, this.selectedCloudSchema.getUpdateJson())
        : this.cloudService.registerCloudProvider(this.selectedCloudSchema);
    tpl = this.editMode ? this.textRepositoryUpdateSucceedRegisterTpl : this.textRepositorySucceedRegisterTpl;
    observable.takeUntil(this.subs)
      .subscribe(
        (model: CloudModel) => {
          if ((typeof this.selectedCloudSchema.accessPayload === 'object')) {
            this.refreshKeys();
          }
          this.reset();
          this.onSuccessfulRegister.emit();
          this.info(SharedService.formatString(tpl, model.name, undefined, AlertType.INFO));
        },
        (err) => {
          this.unmask();
          this.handleError(err, true);
        }
      );
  }

  private onGetSpSchema(): void {
    this.maskContainer();
    this.cloudService.getSpCloudSchema().takeUntil(this.subs)
      .subscribe(
        (model: CloudSchemaModel) => {
          this.selectedCloudSchema = model;
          this.unmaskContainer();
        },
        (err) => {
          this.unmaskContainer();
          this.handleError(err);
        }
      );
  }

  private getAccessKeyPayload(): string | object {
    let model: KeySelectModel = this.getKeyModel();
    if (model)
      return model.useExisting ? model.keyHref : model.getPersistentJson();
  }

  private refreshKeys(): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.refreshKeys();
    }
  }

  private getKeyModel(): KeySelectModel {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.getKeyModel();
  }

  private getCertificateHref(): string {
    return this.cloudCertificateComponent && this.cloudCertificateComponent.getCertificate();
  }

  private hasCertificate(): boolean {
    return this.cloudCertificateComponent && this.cloudCertificateComponent.hasCertificate();
  }

  private resetCertificate(): void {
    if (this.cloudCertificateComponent)
      this.cloudCertificateComponent.resetCertificate();
  }


  private setCertificate(href: string): void {
    if (this.cloudCertificateComponent)
      this.cloudCertificateComponent.setCertificate(href);
  }

  private resetKeyModel(): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.resetKeyModel();
    }
  }

  private setKeyModel(href: string): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.setKeyModel(href);
    }
  }

  private isKeyValid(): boolean {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.isKeyValid();
  }

  private isValid(): boolean {
    return this.isKeyValid() && this.isSchemaValid() && this.hasCertificate();
  }

  private isSchemaValid(): boolean {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.isValid();
  }

  private resetForm(): void {
    if (this.cloudSchemaComponent)
      this.cloudSchemaComponent.reset();
  }
}
