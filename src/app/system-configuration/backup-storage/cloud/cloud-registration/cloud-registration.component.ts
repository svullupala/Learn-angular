import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, 
  Output, ViewChild, AfterViewInit
  
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { CloudSchemaModel } from '../cloud-schema.model';
import { CloudService } from '../cloud.service';
import { CloudParameterModel, CloudParameterNvPairModel } from '../cloud-parameter.model';
import { SessionService } from 'core/session.service';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { CloudModel } from '../cloud.model';
import { BucketModel } from '../bucket.model';
import { KeySelectModel } from '../../../../shared/components/key-selector/key-select.model';
import { CloudSchemaComponent } from '../cloud-schema/cloud-schema.component';
import { SharedService } from 'shared/shared.service';
import { CloudCertificateSelectorComponent } from '../cloud-certificate/cloud-certificate-selector.component';
import { Observable } from 'rxjs/Observable';
import { BucketsModel } from 'cloud/buckets.model';

@Component({
  selector: 'cloud-registration',
  templateUrl: './cloud-registration.component.html',
  styleUrls: ['./cloud-registration.component.scss']
})

export class CloudRegistrationComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() hideRegistration: boolean = false;
  @Output() onSuccessfulRegister: EventEmitter<void> = new EventEmitter<void>();
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private subs: Subject<void> = new Subject<void>();
  @ViewChild('cloudcontainer') private editContainer: ElementRef;
  @ViewChild(CloudSchemaComponent) private cloudSchemaComponent: CloudSchemaComponent;
  @ViewChild(CloudCertificateSelectorComponent) private cloudCertificateComponent: CloudCertificateSelectorComponent;
  private cloudModel: CloudSchemaModel;
  private cloudParam: CloudParameterModel;
  private cloudTypes: Array<CloudParameterNvPairModel>;
  private updateCloud: CloudModel;
  private selectedRegion: string;
  private selectedCloudType: string;
  private defaultProvider: string;
  private selectedCloudSchema: CloudSchemaModel;
  private buckets: Array<BucketModel>;
  private selectedBucket: BucketModel;
  private selectedArchiveBucket: BucketModel;
  private maskedContainer: boolean = false;
  private hasBuckets: boolean = false;
  private textCloudSucceedRegisterTpl: string;
  private textCloudUpdateSucceedRegisterTpl: string;
  private infoTitle: string;
  private errorTitle: string;
  private editMode = false;
  private isArchiveBucketPopulated = false;
  private isBucketPopulated = false;
  private textSameOffloadAndArchiveBucket: string;
  private textError: string;
  private offloadOption: string = undefined;
  private archiveOption: string = undefined;

  constructor(private translate: TranslateService, private cloudService: CloudService) { }

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
    this.selectedCloudType = undefined;
    this.selectedCloudSchema = undefined;
    this.updateCloud = undefined;
    this.buckets = undefined;
    this.selectedBucket = undefined;
    this.selectedArchiveBucket = undefined;
    this.hasBuckets = false;
    this.editMode = false;
    this.isArchiveBucketPopulated = false;
    this.isBucketPopulated = false;
    this.selectedRegion = undefined;
    this.resetCertificate();
    this.resetKeyModel();
  }

  newRegistration(): void {
    this.selectedCloudType = this.defaultProvider;
    if (this.validProviderDefaultValue(this.selectedCloudType))
      this.onProviderChange();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.errorTitle',
      'common.textError',
      'cloud.textCloudUpdateSucceedRegisterTpl',
      'cloud.textCloudSucceedRegisterTpl',
      'cloud.textSameOffloadAndArchiveBucket',
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.errorTitle = resource['common.errorTitle'];
      me.textCloudSucceedRegisterTpl = resource['cloud.textCloudSucceedRegisterTpl'];
      me.textCloudUpdateSucceedRegisterTpl = resource['cloud.textCloudUpdateSucceedRegisterTpl'];
      me.textSameOffloadAndArchiveBucket = resource['cloud.textSameOffloadAndArchiveBucket'];
      me.textError = resource['common.textError'];
    });
  
    me.getCloudSchemaTypes();
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public canRegister(): boolean {
    // SPP-6159 return !!(this.selectedBucket) && (!this.needValidatingCertificate() || this.hasCertificate());
    return !!(this.selectedBucket || this.selectedArchiveBucket);
  }

  public onRegisterCloudProvider(): void {
    let observable: Observable<CloudModel>,
      tpl: string;
    this.mask();
    this.selectedCloudSchema.accessPayload = this.getAccessKeyPayload();
    this.selectedCloudSchema.certificateHref = this.getCertificateHref();
    this.selectedCloudSchema.selectedBucket = (this.isBucketPopulated) ? this.selectedBucket : undefined;
    this.selectedCloudSchema.selectedArchiveBucket = (this.isArchiveBucketPopulated) ? this.selectedArchiveBucket : undefined;
    observable = this.editMode ?
      this.cloudService.updateCloudProvider(this.updateCloud, this.selectedCloudSchema.getUpdateJson())
      : this.cloudService.registerCloudProvider(this.selectedCloudSchema);
    tpl = this.editMode ? this.textCloudUpdateSucceedRegisterTpl : this.textCloudSucceedRegisterTpl;
    observable.takeUntil(this.subs)
      .subscribe(
        (model: CloudModel) => {
          this.unmask();
          if ((typeof this.selectedCloudSchema.accessPayload === 'object')) {
            this.refreshKeys();
          }
          this.reset();
          this.onSuccessfulRegister.emit();
          this.info(SharedService.formatString(tpl, model.name, undefined, AlertType.INFO));
        },
        (err) => this.handleError(err, true)
      );
  }

  public setCloud(cloud: CloudModel): void {
    if (cloud) {
      this.editMode = true;
      this.selectedBucket = new BucketModel();
      this.selectedArchiveBucket = new BucketModel();
      this.selectedBucket.name = (cloud.properties && cloud.properties.bucket) || 'N/A';
      this.selectedArchiveBucket.name = (cloud.properties && cloud.properties.archiveBucket) || 'N/A';
      this.buckets = [this.selectedBucket, this.selectedArchiveBucket];
      this.hasBuckets = true;
      this.updateCloud = cloud;
      this.selectedCloudType = cloud.provider;
      this.setKeyModel(cloud.accesskey ? cloud.accesskey.href : '');
      this.onProviderChange(cloud);
      if (this.selectedArchiveBucket.name !== 'N/A') {
        this.isArchiveBucketPopulated = true;
      } else {
        this.buckets = [];
      }
      if (this.selectedBucket.name !== 'N/A') {
        this.isBucketPopulated = true;
      } else {
        this.buckets = [];
      }
    }
  }

  private isCertificateSupport(type: string): boolean {
    return type === 'aws' || type === 'azure';
  }

  private handleSchemaValueChanges(values: object): void {
    // reset bucket list for aws use case. Don't allow user to select bucket from different region and vice versa.
    if (values['region'] && typeof values['region'] === 'string' && !this.editMode) {
      if (typeof this.selectedRegion === 'string' && this.selectedRegion !== values['region']) {
        this.hasBuckets = false;
        this.buckets = undefined;
        this.selectedBucket = undefined;
        this.selectedArchiveBucket = undefined;
      } else {
        this.selectedRegion = values['region'];
      }
    }
  }

  private validProviderDefaultValue(value: string): boolean {
    return value && value.length > 0 && value !== 'sp';
  }

  private getCloudSchemaTypes(): void {
    this.maskContainer();
    this.cloudService.getCloudSchemaTypes().takeUntil(this.subs)
      .subscribe(
        (model: CloudSchemaModel) => {
          this.cloudModel = model;
          this.cloudParam = model.getParameters()[0];

          this.cloudTypes = this.cloudParam.values || [];
          this.unmaskContainer();

          // Attempt to remember the default provider(i.e. the first parameter).
          if (this.validProviderDefaultValue(this.cloudParam.defaultValue))
            this.defaultProvider = this.cloudParam.defaultValue;
        },
        (err) => {
          this.unmaskContainer();
          this.handleError(err);
        }
      );
  }

  private onProviderChange(cloud?: CloudModel): void {
    this.maskContainer();
    this.cloudService.getCloudSchema(this.cloudModel, this.selectedCloudType).takeUntil(this.subs)
      .subscribe(
        (model: CloudSchemaModel) => {
          this.selectedCloudSchema = model;
          if (this.editMode && cloud) {
            this.selectedCloudSchema.selectedBucket = this.selectedBucket;
            this.selectedCloudSchema.selectedArchiveBucket = this.selectedArchiveBucket;
            this.selectedCloudSchema.certificateHref = cloud.properties && cloud.properties.certificate
              ? cloud.properties.certificate['href']
              : '';
            this.setCertificate(this.selectedCloudSchema.certificateHref);
            setTimeout(() => {
              this.cloudSchemaComponent.updateSchemaForm(cloud);
              this.setParamSchemaValue('enableDeepArchive', cloud.properties.enableDeepArchive);
            }, 150);
          }
          this.unmaskContainer();
        },
        (err) => {
          this.unmaskContainer();
          this.handleError(err);
        }
      );
  }

  private setParamSchemaValue(name: string, value: any): void {
    let param: CloudParameterModel = this.getParamSchema(name);
    if (param) {
      param.value = value;
    }
  }

  private getParamSchema(name: string): CloudParameterModel {
    if (this.selectedCloudSchema) {
      let retVal =  this.selectedCloudSchema.getParameters().find((param) => {
        return param.name == name;
      });
      return retVal;
    } 
    
    return undefined;
  }

  private handleClickSelect() {
    if (this.buckets.length === 0) {
      this.getBuckets();
    }
  }

  private retrieveBuckets(): void {
    let me = this, target: BucketModel;
    if (me.selectedBucket) {
      target = (me.buckets || []).find(function (item) {
        return item.name === me.selectedBucket.name;
      });
      me.selectedBucket = target;
    }
    if (me.selectedArchiveBucket) {
      target = (me.buckets || []).find(function (item) {
        return item.name === me.selectedArchiveBucket.name;
      });
      me.selectedArchiveBucket = target;
    }
  }

  private getBuckets(): void {
    this.mask();
    this.selectedCloudSchema.accessPayload = this.getAccessKeyPayload();
    this.cloudService.getBuckets(this.selectedCloudSchema).takeUntil(this.subs)
      .subscribe(
        (model: BucketsModel) => {
          this.unmask();
          this.buckets = model.buckets || [];
          this.hasBuckets = this.buckets.length > 0;
          this.retrieveBuckets();
        },
        (err) => {
          this.unmask();
          this.handleError(err);
        }
      );
  }

  private isProvider(value: string): boolean {
    if (this.selectedCloudSchema
      && this.selectedCloudSchema.provider
      && this.selectedCloudSchema.provider === value) {
      return true;
    }
    return false;
  }

  private setCertificate(href: string): void {
    if (this.cloudCertificateComponent)
      this.cloudCertificateComponent.setCertificate(href);
  }

  private refreshKeys(): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.refreshKeys();
    }
  }

  private setKeyModel(href: string): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.setKeyModel(href);
    }
  }

  private getAccessKeyPayload(): string | object {
    let model: KeySelectModel = this.getKeyModel();
    if (model)
      return model.useExisting ? model.keyHref : model.getPersistentJson();
  }

  private getKeyModel(): KeySelectModel {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.getKeyModel();
  }

  private getCertificateHref(): string {
    if (this.selectedCloudType === 'aws')
      return undefined;
    return this.cloudCertificateComponent && this.cloudCertificateComponent.getCertificate();
  }

  private hasCertificate(): boolean {
    if (this.selectedCloudType === 'aws')
      return true;
    return this.cloudCertificateComponent && this.cloudCertificateComponent.hasCertificate();
  }

  private resetCertificate(): void {
    if (this.cloudCertificateComponent)
      this.cloudCertificateComponent.resetCertificate();
  }

  private resetKeyModel(): void {
    if (this.cloudSchemaComponent) {
      this.cloudSchemaComponent.resetKeyModel();
    }
  }

  private isKeyValid(): boolean {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.isKeyValid();
  }

  private isValidForConnection(): boolean {
    return this.selectedCloudSchema && this.isKeyValid() && this.isSchemaValid()
        /*&& this.hasCertificate() && !this.hasBuckets */;
  }

  private isSchemaValid(): boolean {
    return this.cloudSchemaComponent && this.cloudSchemaComponent.isValid();
  }

  private needValidatingCertificate(): boolean {
    return this.selectedCloudType === 'cos';
  }


  private onClickingOffloadOption(event: any) {
    let me = this;
    if (me.selectedBucket && me.selectedArchiveBucket
      && me.selectedBucket.name === me.selectedArchiveBucket.name) {
      me.alert.show(me.textError, me.textSameOffloadAndArchiveBucket, AlertType.ERROR);
      me.isBucketPopulated = false;
      me.selectedBucket = undefined;
      event.target.value = '';

    } else {
      me.offloadOption = event.target.value;
      me.isBucketPopulated = true;
    }
  }

  private onClickingArchiveOption(event: any) {
    let me = this;
    if (me.selectedBucket && me.selectedArchiveBucket
      && me.selectedBucket.name === me.selectedArchiveBucket.name) {
      me.alert.show(me.textError, me.textSameOffloadAndArchiveBucket, AlertType.ERROR);
      me.isArchiveBucketPopulated = false;
      me.selectedArchiveBucket = undefined;
      event.target.value = '';
    } else {
      me.archiveOption = event.target.value;
      me.isArchiveBucketPopulated = true;
    }
  }

}
