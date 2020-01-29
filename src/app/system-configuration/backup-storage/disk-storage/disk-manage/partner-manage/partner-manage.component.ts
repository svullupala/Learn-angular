import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PartnerModel } from './partner.model';
import { StorageManageService } from '../../shared/storage-manage.service';
import { StorageModel } from '../../shared/storage.model';
import { JsonConvert } from 'json2typescript/index';
import { StoragesModel } from '../../shared/storages.model';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'app/shared/components/index';
import { SessionService } from 'core';
import { PartnersModel } from './partners.model';
import { ErrorModel } from 'shared/models/error.model';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'partner-manage',
  templateUrl: './partner-manage.component.html'
})

export class PartnerManageComponent implements OnInit, OnDestroy {

  @Input() partnerList: Array<PartnerModel>;
  @Input() managePartner: PartnersModel;
  @Input() sites = [];
  @Input() storageParent = '';
  @Output() reloadPartners = new EventEmitter();
  @Output() _onCancel = new EventEmitter();
  @ViewChild('addPartnersContainer') addPartnersContainer: ElementRef;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  storageList: Array<StorageModel> = undefined;

  private maskList: boolean = false;
  private addPartnersExpanded: boolean = false;
  private selectedPartner: StorageModel = undefined;
  private infoTitle: string;
  private addedPartnerMsg: string;
  private removedPartnerMsg: string;
  private subs: Subject<void> = new Subject<void>();

  constructor(private storageManageService: StorageManageService, private translateService: TranslateService) {
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnInit() {
    let me = this, endpoint = me.storageManageService.getNodeServiceEndpoint();

    me.storageManageService.getStorageItemSubs.takeUntil(me.subs).subscribe(
      () => {
        me.loadData();
      }
    );
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translateService.get('common.nodeService')
      .subscribe((res: string) => {
        me.translateService.get([
          'common.infoTitle',
          'storage.addedPartnerMsg',
          'storage.removedPartnerMsg'], { service: res, endpoint: endpoint })
          .subscribe((resource: Object) => {
            me.infoTitle = resource['common.infoTitle'];
            me.addedPartnerMsg = resource['storage.addedPartnerMsg'];
            me.removedPartnerMsg = resource['storage.removedPartnerMsg'];
          });
      });
  }

  mask(): void {
    this.maskList = true;
  }

  unmask(): void {
    this.maskList = false;
  }
  onPartnerAddClick(storagePartner: StorageModel): void {
    let me = this;
    me.mask();
    me.storageManageService.addPartner(me.managePartner, storagePartner.storageId)
      .subscribe(
        data => {
          me.reloadPartners.emit();
          me.unmask();
          me.info(me.addedPartnerMsg);
          me.selectedPartner = undefined;
        },
        err => {
          me.handleError(err, false);
          me.unmask();
        });
  }


  onRemoveClick(partner: PartnerModel): void {
    let me = this;
    me.mask();
    me.storageManageService.removePartner(partner, partner.storageId)
      .subscribe(
        data => {
          me.reloadPartners.emit();
          me.unmask();
          me.info(me.removedPartnerMsg);
        },
        err => {
          me.handleError(err, false);
          me.unmask();
        });
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  info(errOrMsg: ErrorModel | string, title?: string) {
    let me = this;
    if (me.alert) {
      if (errOrMsg instanceof ErrorModel)
        me.alert.show(errOrMsg.title, errOrMsg.message, AlertType.ERROR);
      else
        me.alert.show(title || me.infoTitle, errOrMsg);
    }
  }

  onSelectPartner(item: StorageModel): void {
    this.selectedPartner = item;
  }

  onCancel(): void {
    this._onCancel.emit();
  }

  public isDisabled(): boolean {
    return this.selectedPartner === undefined;
  }

  public onAddClick(): void {
    this.onPartnerAddClick(this.selectedPartner);
  }

  private loadData() {
    let me = this;
    me.mask();
    me.storageManageService.getAll()
      .subscribe(
        data => {
          let dataset: StoragesModel = JsonConvert.deserializeObject(data, StoragesModel);
          me.filterValidPartners(dataset.records);
          me.unmask();
        },
        err => me.handleError(err)
      );
  }

  private filterValidPartners(storages: StorageModel[]) {
    let me = this, currentPartner = false;
    me.selectedPartner = undefined;
    me.storageList = [];
    if (Array.isArray(storages) && storages.length > 0) {
      for (let i = 0; i < storages.length; i++) {
        if (storages[i].demo === undefined || storages[i].demo === false) {
          if (me.partnerList) {
            for (let p = 0; p < me.partnerList.length; p++) {
              if (storages[i].storageId === me.partnerList[p].storageId) {
                currentPartner = true;
              }
            }
          }
          if (storages[i].storageId !== me.storageParent && !currentPartner) {
            me.storageList.push(storages[i]);
          }
          currentPartner = false;
        }
      }
    }
  }

  private getAddPartnersContainer(): any {
    let me = this, element = me.addPartnersContainer && me.addPartnersContainer.nativeElement;
    return element;
  }

  private switchAddPartnersContainer(): void {
    let me = this, element = me.getAddPartnersContainer();
    if (element) {
      $(element).toggle();
      me.addPartnersExpanded = !me.addPartnersExpanded;
    }
    if (me.addPartnersExpanded) {
      me.loadData();
    }
  }
}
