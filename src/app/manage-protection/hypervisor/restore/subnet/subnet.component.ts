import {Component, OnDestroy, Input, OnInit, ViewChild, ElementRef} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs/Subscription';
import {NgForm, Validators} from '@angular/forms';
import {SubnetService} from './subnet.service';
import {SubnetListTableComponent} from './subnet-list-table/subnet-list-table.component';
import {SubnetItem} from './subnet-item.model';
import {BasicDynamicForm} from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import {HypervisorModel} from '../../shared/hypervisor.model';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import * as _ from 'lodash';

@Component({
  selector: 'subnet-component',
  templateUrl: 'subnet.component.html',
  styleUrls: ['subnet.component.scss'],
  providers: [SubnetService]
})

export class SubnetComponent implements OnInit, OnDestroy {

  @ViewChild('subnetform') form: NgForm;
  @ViewChild(SubnetListTableComponent) subnetListComponent: SubnetListTableComponent;
  @ViewChild(BasicDynamicForm) subnetMappingForm: BasicDynamicForm;
  @Input() subnets: any;
  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;

  private formValues;
  private alert: AlertComponent;
  private translateSub: Subscription;
  private isValid: boolean = false;
  private errorTitle: string;
  private validHostAddressRegex =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  private subnetValue: string;
  private textSubnetErr: string;
  private subnetRadioVal: string = 'system';
  private subnetList: Array<SubnetItem>;
  private editMode: boolean = false;
  private editIndex: number;
  private staticAddress: boolean = false;
  private mappingEditorExpanded: boolean = false;
  @ViewChild('mapping')
  private mappingEditor: ElementRef;

  constructor(private subnetService: SubnetService, private translate: TranslateService) {}

  ngOnInit() {
    let me = this;
    me.formValues = me.subnetService.getSubnetForm();
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translateSub = me.translate.get([
      'common.errorTitle',
      'hypervisor.textSubnetErr',
    ]).subscribe((resource: Object) => {
      me.errorTitle = resource['common.errorTitle'];
      me.textSubnetErr = resource['hypervisor.textSubnetErr'];
    });
    if (typeof this.subnets === 'object' && !_.isEmpty(this.subnets) ) {
      this.setSubnetRadioVal(this.subnets);
      this.subnetList = this.setSubnetsModel(this.subnets) || [];
    }
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.subnetMappingForm) {
      this.subnetMappingForm.setFormControlValidators('subnet', [Validators.required,
        Validators.pattern(this.validHostAddressRegex)]);
      this.subnetMappingForm.setFormControlValidators('subnetmask', [Validators.required,
        Validators.pattern(this.validHostAddressRegex)]);
      this.subnetMappingForm.setFormControlValidators('gateway', [Validators.required,
        Validators.pattern(this.validHostAddressRegex)]);
    }
  }

  public getValue() {
    let subnetArr: Array<SubnetItem> = this.subnetListComponent && this.subnetListComponent.getValue();
    return this.subnetService.getSubnetPayload(this.subnetRadioVal, subnetArr);
  }

  public isSubnetValid(subnetPayload: Object, silent?: boolean): boolean {
    if (_.isEmpty(subnetPayload)) {
      if (!silent) {
        this.alertErr();
      }
      return false;
    }
    return true;
  }

  public setSubnets(subnets: any): void {
    if (this.subnetListComponent) {
      this.setSubnetRadioVal(this.subnets);
      if (typeof this.subnets['systemDefined'] === 'boolean') {
        this.subnetList = [];
        this.subnetListComponent.setSubnetList(this.subnetList);
      } else if (this.subnets === 'object') {
        this.subnetList = this.setSubnetsModel(subnets) || [];
      }
    }
  }

  public reset(): void {

    if (this.subnetMappingForm) {
      this.subnetMappingForm.cancel();
    }
    this.staticAddress = false;
    this.editMode = false;
    this.subnetValue = undefined;
  }

  private isMappingsValid() {
    let subVal: Object;
    if (this.staticAddress === true) {
      subVal = this.subnetMappingForm && this.subnetMappingForm.getValue();
      return this.isMappingAddressValid()
        && this.validHostAddressRegex.test((subVal && subVal['subnet']) || '')
        && this.validHostAddressRegex.test((subVal && subVal['subnetmask']) || '')
        && this.validHostAddressRegex.test((subVal && subVal['gateway']) || '');
    }
    return this.isMappingAddressValid();
  }

  private isMappingAddressValid() {
    this.isValid = this.validHostAddressRegex.test(this.subnetValue);
    return this.isValid;
  }

  private onEnterPressed(keyStroke) {
    if (keyStroke.keyCode === 13 && this.isMappingsValid() && this.editMode === false) {
      this.onAddSubnetMapping(this.subnetValue);
    } else if (keyStroke.keyCode === 13 && this.isMappingsValid() && this.editMode === true) {
      this.updateSubnetItem();
    }
  }

  private setSubnetRadioVal(subnets: any) {
    if (subnets && typeof subnets['systemDefined'] === 'boolean') {
       this.subnetRadioVal = subnets['systemDefined'] ? 'system' : 'original';
    } else if (typeof subnets === 'object') {
      this.subnetRadioVal = 'mapping';
    }
  }

  private setSubnetsModel(subnets: any): Array<SubnetItem> {
    let ip: string,
    subnet: SubnetItem,
    subnetArr: Array<SubnetItem> = [];

    if (subnets && !(typeof subnets['systemDefined'] === 'boolean')) {
      for (let key in subnets) {
        if (subnets.hasOwnProperty(key)) {
          ip = (subnets[key].metadata && subnets[key].metadata['ip']) || '';
          if (typeof subnets[key]['dhcp'] === 'boolean') {
            subnet = subnets[key]['dhcp']
              ? (subnet = new SubnetItem(true, ip))
              : (subnet = new SubnetItem(false, ip, subnets[key]['subnet'],
                subnets[key]['subnetmask'], subnets[key]['gateway'], subnets[key]['dnslist']));
            subnetArr.push(subnet);
          }
        }
      }
    }
    return subnetArr || [];
  }

  private onAddSubnetMapping(value: string) {
    let ip = value,
        subnet: SubnetItem,
        mappingInfo;

    if (this.subnetRadioVal === 'mapping' && this.staticAddress) {
      if (this.subnetMappingForm) {
        mappingInfo = this.subnetMappingForm.getValue();
        subnet = new SubnetItem(false,
          ip, mappingInfo.subnet, mappingInfo.subnetmask,
          mappingInfo.gateway, mappingInfo.dnslist);
      }
    } else if (this.subnetRadioVal === 'mapping' && !this.staticAddress) {
      subnet = new SubnetItem(true, ip);
    }
    this.subnetListComponent.onAddSubnetMapping(subnet);
    this.reset();
  }

  private onSubnetEdit(subnetObj: {subnet: SubnetItem, index: number}) {
    this.editMode = true;
    this.staticAddress = !subnetObj.subnet.dhcp;
    this.subnetValue = subnetObj.subnet.metadata.ip;
    this.editIndex = subnetObj.index;
    setTimeout(() => {
      if (this.staticAddress && this.subnetMappingForm) {
        this.subnetMappingForm.patchValue(subnetObj.subnet);
      }
    }, 100);
  }

  private updateSubnetItem() {
    this.onAddSubnetMapping(this.subnetValue);
    if (this.subnetListComponent) {
      this.subnetListComponent.onDeleteMapping(this.editIndex);
      this.reset();
      this.editIndex = undefined;
    }
  }

  private isHyperV(): boolean {
    return this.hypervisorType === HypervisorModel.TYPE_HYPERV;
  }

  private alertErr(errMsg?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(me.errorTitle, errMsg || me.textSubnetErr, AlertType.ERROR);
    }
  }

  private getMappingEditor(): any {
    let me = this, element = me.mappingEditor && me.mappingEditor.nativeElement;
    return element;
  }

  private switchMappingEditor(): void {
    let me = this, element = me.getMappingEditor();
    if (element) {
      $(element).toggle();
      this.mappingEditorExpanded = !this.mappingEditorExpanded;
    }
  }
}
