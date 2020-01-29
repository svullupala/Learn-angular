import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs/Subscription';
import {JsonConvert} from 'json2typescript';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {HypervisorRestoreService} from '../hypervisor-restore.service';
import {VmsModel} from '../../shared/vms.model';
import {VmRecoveryPointsService} from '../../shared/vmrecoverypoints.service';
import {VmModel} from '../../shared/vm.model';
import {HostModel} from '../../shared/host.model';
import {RestoreItem} from '../restore-item.model';
import {SorterModel} from 'shared/models/sorter.model';
import {HypervisorModel} from '../../shared/hypervisor.model';
import {HasPersistentJson} from 'core';
import * as _ from 'lodash';
export class VdiskSelectionModel implements HasPersistentJson {
  public sourceUrl: string;
  public address: string;
  public controllertype: string;
  public mode: string;
  public lun: string;
  public targetHref: string;

  constructor(sourceUrl: string, address: string, controllertype: string,
              mode: string, lun: string, targetHref: string) {
    this.sourceUrl = sourceUrl;
    this.address = address;
    this.controllertype = controllertype;
    this.mode = mode;
    this.lun = lun;
    this.targetHref = targetHref;
  }

  public getPersistentJson() {
    let payload = {};

    return payload[this.sourceUrl] = {
      address: this.address,
      controllertype: this.controllertype,
      lun: this.lun,
      mode: this.mode,
      target: {
        href: this.targetHref
      }
    };
  }
}

@Component({
  selector: 'vdisk-component',
  templateUrl: 'vdisk.component.html'
})

export class VdiskComponent implements OnInit, OnDestroy {

  @ViewChild('vdiskform') form: NgForm;
  @Input() sourceList: Array<RestoreItem>;
  @Input() hypervisorType: string;
  @Input() mapVdiskInfo: any;

  private mapVdiskArr: Array<VdiskSelectionModel>;
  private diskModeVal: string = 'persistent';
  private updateDesSub: Subscription;
  private updateSub: Subscription;
  private getVmsSub: Subscription;
  private translateSub: Subscription;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private controllerTypeOptionValues: Array <any>;
  private diskModeValues: Array <any>;
  private destinationVms: Array<VmModel>;
  private errorTitle: string;
  private textVdiskErr: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private masked: boolean = false;
  private summaryArray: any[] = [];

  constructor(private translate: TranslateService,
              private vmService: VmRecoveryPointsService,
              private hypervisiorRestoreService: HypervisorRestoreService) {}

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.updateSub = me.hypervisiorRestoreService.updateSub.subscribe(
      (records: Array<RestoreItem>) => {
        me.sourceList = records;
    });
    me.updateDesSub = me.hypervisiorRestoreService.updateDestinationHostClusterSub.subscribe(
      (selection) => me.getDestinationVms(selection));
    me.translateSub = me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.selectModeText',
      'common.errorTitle',
      'vmware.busLogicText',
      'vmware.lsiText',
      'vmware.lsiParallelText',
      'vmware.vmwareParavirtualText',
      'vmware.sameAsSourceText',
      'vmware.persistentText',
      'vmware.independentPersistentText',
      'vmware.independentNonPersistentText',
      'vmware.destinationControllerAddressText',
      'vmware.destinationControllerLunText',
      'vmware.destinationControllerTypeText',
      'vmware.destinationVmText',
      'vmware.destinationVmModeText',
      'hypervisor.textVdiskErr',
      'vmware.sourceVdisksText'
    ]).subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.errorTitle = resource['common.errorTitle'];

        me.textVdiskErr = resource['hypervisor.textVdiskErr'];
        me.mapVdiskArr = me.setVdiskSelectionModel(me.mapVdiskInfo);
        if (!me.isHyperV()) {
          me.diskModeValues = [{
            label: resource['vmware.persistentText'],
            value: 'persistent'
          }, {
            label: resource['vmware.independentPersistentText'],
            value: 'independent_persistent'
          }, {
            label: resource['vmware.independentNonPersistentText'],
            value: 'independent_nonpersistent'
          }];

          me.controllerTypeOptionValues = [{
            label: resource['vmware.busLogicText'],
            value: 'BusLogic'
          }, {
            label: resource['vmware.lsiText'],
            value: 'LSI SAS'
          }, {
            label: resource['vmware.lsiParallelText'],
            value: 'LSI Parallel'
          }, {
            label: resource['vmware.vmwareParavirtualText'],
            value: 'VMware Paravirtual"'
          }];
        }
      });
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
    this.updateSub.unsubscribe();
    this.updateDesSub.unsubscribe();
    if (this.getVmsSub) {
      this.getVmsSub.unsubscribe();
    }
  }
  /**
   * Handle select 
   * @param index index of row
   * @param type select | input
   */
  handleSelect(event: any, index: number, type: string, name: string) {
    let me = this;
    if (me.summaryArray.length === 0) {
      me.getSummaryText();
    }
    if (type === 'select') {
      let selectedOptions = event.target['options'];
      let selectedIndex = selectedOptions.selectedIndex;
      let selectElementText = selectedOptions[selectedIndex].text;
      me.summaryArray[index][name] = selectElementText;
    } else if (type === 'input') {
      me.summaryArray[index][name] = event;
    }
  }

  public getSummaryText(): any[] {
    let me = this;
    if (me.summaryArray.length === 0 && me.sourceList) {
      for (let i = 0; i < me.sourceList.length; i++) {
        me.summaryArray.push({
          name: me.sourceList[i].resource.name,
          destinationVM: '',
          diskMode: '',
          controllerType: '',
          address: '',
          lun: ''
        });
      }
    }
    return me.summaryArray;
  }


  setvDisks(vDisks): void {
    this.mapVdiskArr = this.setVdiskSelectionModel(vDisks);
  }

  getValue(): Object | boolean {
    let vdiskVal: Object;
    if (this.form && this.form.value) {
      vdiskVal = this.form.value;
      for (let key in vdiskVal) {
        if (vdiskVal.hasOwnProperty(key)) {
          if (vdiskVal[key]['address'] === '') {
            delete vdiskVal[key]['address'];
          }
          if (vdiskVal[key]['controllertype'] && vdiskVal[key]['controllertype'] === '') {
            delete vdiskVal[key]['controllertype'];
          }
          if (vdiskVal[key]['lun'] === '') {
            delete vdiskVal[key]['lun'];
          }
        }
      }
    }
    return vdiskVal;
  }

  public isValid(vdisks: Object, silent?: boolean): boolean {
    let valid: boolean = true;
    if (typeof vdisks === 'object') {
      _.forIn(vdisks, (value, key) => {
        if (vdisks.hasOwnProperty(key)) {
          if (vdisks[key]['target'] === undefined
            || typeof vdisks[key]['target']['href'] !== 'string') {
            valid = false;
            if (!silent) {
              this.alertErr();
            }
            return false;
          }
        }
      });
    }
    return valid;
  }

  private setVdiskSelectionModel(vDiskSelections): Array<VdiskSelectionModel> {
    let vDisks: Array<VdiskSelectionModel> = [];
    if (typeof vDiskSelections === 'object') {
      for (let key in vDiskSelections) {
        if (vDiskSelections.hasOwnProperty(key)) {
          let model = new VdiskSelectionModel(key,
            vDiskSelections[key]['address'], vDiskSelections[key]['controllertype'],
            vDiskSelections[key]['mode'], vDiskSelections[key]['lun'],
            vDiskSelections[key]['target']['href']);
          vDisks.push(model);
        }
      }
    }
    return vDisks;
  }

  private getDestinationVms(altLocation: HostModel) {
    if (altLocation && altLocation.hasLink('vms')) {
      this.mask();
      this.getVmsSub = this.vmService.getByUrl(altLocation.getUrl('vms'), [],
      [new SorterModel('name', 'ASC')]
      ).subscribe (
          data => {
            // Cast the JSON object to vms instance.
            let dataset = JsonConvert.deserializeObject (data, VmsModel);
            let items = dataset.records;
            this.destinationVms = items;
            this.unmask();
          },
          err => {
            this.unmask();
            this.handleError(err);
          }
        );
    }
  }

  private alertErr(errMsg?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.errorTitle, errMsg || me.textVdiskErr, AlertType.ERROR);
    }
  }

  private mask() {
    this.masked = true;
  }

  private unmask() {
    this.masked = false;
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }
}
