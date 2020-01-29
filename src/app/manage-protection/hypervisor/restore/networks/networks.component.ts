import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs/Subscription';
import {JsonConvert} from 'json2typescript';
import {NgForm} from '@angular/forms';
import * as _ from 'lodash';
import {RestoreItem} from '../restore-item.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {VmRecoveryPointsService} from '../../shared/vmrecoverypoints.service';
import {HypervisorRestoreService} from '../hypervisor-restore.service';
import {SessionService} from 'core';
import {HostModel} from '../../shared/host.model';
import {NetworksModel} from '../../shared/networks.model';
import {SubnetComponent} from '../subnet/subnet.component';
import {NetworkModel} from '../../shared/network.model';
import {SorterModel} from 'shared/models/sorter.model';
import {HypervisorModel} from '../../shared/hypervisor.model';
import { Subject } from 'rxjs/Subject';
import { HostUserModel } from '../host-cluster-table/host-cluster-table.component';
import { IdentityUserModel } from 'identity/shared/identity-user.model';

export class NetworkSelectionModel {
  public url: string;
  public recovery: string;
  public test: string;

  constructor(url: string, recovery: string, test: string) {
    this.url = url;
    this.recovery = recovery;
    this.test = test;
  }
}

export type NetworkSelection = {
  production: string;
  test: string;
};

@Component({
  selector: 'virtual-network-component',
  templateUrl: 'networks.component.html',
  styleUrls: ['./networks.component.scss']
})

export class VirtualNetworkComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('network') form: NgForm;
  @ViewChild(SubnetComponent) subnetComponent: SubnetComponent;
  @Input() sourceList: Array<RestoreItem>;
  @Input() mapVirtualNetwork: any;
  @Input() subnets: any;
  @Input() enableEsxUser: boolean = false;
  @Input() hypervisorType: string = HypervisorModel.TYPE_VMWARE;

  private networks: Array<NetworkModel>;
  private networkSelections: Array<NetworkSelectionModel> = [];
  private sourceNetworks: Array<NetworkModel>;
  private subs: Subject<void> = new Subject<void>();
  private currDestSelection: any;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private errorTitle: string;
  private textNetworksSameErr: string;
  private textNetworksErr: string;
  private textSelectHost: string;
  private textNoNetworks: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private networkMask: boolean = false;
  private masked: boolean = false;
  private sourceNetworksReady: boolean;
  private networksReady: boolean;

  // Summary
  private summaryArray: any[] = [];

  private get syncReady():  boolean {
    return this.sourceNetworksReady && this.networksReady;
  }

  private set syncReady(value: boolean) {
    this.sourceNetworksReady = value;
    this.networksReady = value;
  }

  constructor(private translate: TranslateService,
              private vmService: VmRecoveryPointsService,
              private hypervisiorRestoreService: HypervisorRestoreService) {}

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.hypervisiorRestoreService.updateSub.takeUntil(me.subs).subscribe(
      (records: Array<RestoreItem>) => {
        me.sourceList = records;
        if (me.currDestSelection !== undefined)
          me.getSourceNetworks(me.sourceList);
      });
    me.hypervisiorRestoreService.updateDestinationHostClusterSub.takeUntil(me.subs).subscribe(
      (selection) => {
        me.currDestSelection = selection;
        me.getSourceNetworks(me.sourceList);
        me.getNetworks(selection);
      });
    me.hypervisiorRestoreService.updateDestinationEsxHostSub.takeUntil(me.subs).subscribe(
      (model: HostUserModel) => {
        me.currDestSelection = model.host;
        me.getSourceNetworks(me.sourceList);
        me.getNetworks(model.host, model.user);
      });
    me.translate.get([
      'common.infoTitle',
      'common.sourceText',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.errorTitle',
      'hypervisor.textNetworksSameErr',
      'hypervisor.textNetworksErr',
      'hypervisor.textProduction',
      'hypervisor.textSelectOneHostOrCluster',
      'hypervisor.textNoNetworksFound',
      'hypervisor.textTest'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textNetworksSameErr = resource['hypervisor.textNetworksSameErr'];
        me.textNetworksErr = resource['hypervisor.textNetworksErr'];
        me.textSelectHost = resource['hypervisor.textSelectOneHostOrCluster'];
        me.textNoNetworks = resource['hypervisor.textNoNetworksFound'];
        me.errorTitle = resource['common.errorTitle'];
      });

    if (me.mapVirtualNetwork) {
      me.networkSelections = me.setNetworkModel(me.mapVirtualNetwork);
    }
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['mapVirtualNetwork'] && !changes['mapVirtualNetwork'].isFirstChange()) {
      if (me.mapVirtualNetwork) {
        me.networkSelections = me.setNetworkModel(me.mapVirtualNetwork);
        me.updateSelection();
      }
    }
  }

  handleSelect(event: any, index: number, type: string) {
    let me = this;
    let selectedOptions = event.target['options'];
    let selectedIndex = selectedOptions.selectedIndex;
    let selectElementText = selectedOptions[selectedIndex].text;
    me.summaryArray[index][type] = selectElementText;
  }

  public getSummaryText(): any[] {
    let me = this;
    if (me.summaryArray.length === 0 && me.sourceNetworks) {
      for (let i = 0; i < me.sourceNetworks.length; i++) {
        me.summaryArray.push({name: me.sourceNetworks[i].name, production: '', test: ''});
      }
    }
    return me.summaryArray;
  }

  protected updateSelection(): void {
    let me = this;
    if (me.sourceNetworks && me.summaryArray.length === me.sourceNetworks.length) {
      for (let i = 0; i < me.sourceNetworks.length; i++) {
        let selection = me.syncNetworkSelection(i);
        me.summaryArray[i]['production'] = selection.production;
        me.summaryArray[i]['test'] = selection.test;
      }
    }
  }

  public getValue(): Object {
    return this.form && this.form.value;
  }

  public isValid(networks: Object, silent?: boolean): boolean {
    let test: string,
        recovery: string,
        valid: boolean = true;
    if (typeof networks === 'object') {
      _.forIn(networks, (value, key) => {
        if (networks.hasOwnProperty(key)) {
          test = networks[key]['test'] || '';
          recovery = networks[key]['recovery'] || '';
          if (test.length < 1 || recovery.length < 1) {
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

  public getSubnetValue() {
    if (this.isHyperV()) {
      return {systemDefined: true};
    }
    return this.subnetComponent && this.subnetComponent.getValue();
  }

  public setSubnets(subnets: any) {
    if (this.subnetComponent) {
      this.subnetComponent.setSubnets(subnets);
    }
  }

  public isSubnetValid(subnetPayload: Object, silent?: boolean): boolean {
    return this.subnetComponent && this.subnetComponent.isSubnetValid(subnetPayload, silent);
  }

  public playbackNetworkSelections(records: Array<RestoreItem>, mapVirtualNetwork) {
    if (records) {
      this.sourceList = records;
      this.networkSelections = this.setNetworkModel(mapVirtualNetwork);
    }
  }

  private setNetworkModel(mapVirtualNetworks): Array<NetworkSelectionModel> {
    let virtualNetworks: Array<NetworkSelectionModel> = [];
    if (mapVirtualNetworks) {
      for (let key in mapVirtualNetworks) {
        if (mapVirtualNetworks.hasOwnProperty(key)) {
          let model = new NetworkSelectionModel(key,
            mapVirtualNetworks[key]['recovery'], mapVirtualNetworks[key]['test']);
          virtualNetworks.push(model);
        }
      }
    }
    return virtualNetworks;
  }

  private getNetworks(altLocation: HostModel, user?: IdentityUserModel) {
    let me = this, linkName: string = 'networks',
        url: string;
    if (user) {
      linkName = 'livenetworks';
    }
    if (altLocation && altLocation.hasLink(linkName)) {
      me.networksReady = false;
      url = user ? (altLocation.getUrl(linkName) + `?hostuser=${user.id}`) : (altLocation.getUrl(linkName));
      this.networkMasked();
      this.vmService.getByUrl(url,
        [],
        [new SorterModel('name', 'ASC')])
        .takeUntil(this.subs).subscribe (
          data => {
            let dataset = JsonConvert.deserializeObject (data, NetworksModel);
            this.networks = dataset.records;
            me.networksReady = true;
            me.updateSelection();
            this.networkUnMasked();
          },
          err => {
            this.networkUnMasked();
            this.handleError(err);
          }
        );
    }
  }

  private getSourceNetworks(records: Array<RestoreItem>) {
    let me = this;
    if (records && records.length > 0) {
      me.sourceNetworksReady = false;
      this.mask();
      this.hypervisiorRestoreService.queryAssociatedWith(records, 'network')
        .takeUntil(this.subs).subscribe (
          data => {
            let dataset = JsonConvert.deserializeObject (data, NetworksModel);
            this.sourceNetworks = dataset.records;
            me.sourceNetworksReady = true;
            me.updateSelection();
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
      me.alert.show(me.errorTitle, errMsg || me.textNetworksErr, AlertType.ERROR);
    }
  }

  private networkMasked(): void {
    this.networkMask = true;
  }

  private networkUnMasked(): void {
    this.networkMask = false;
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

  private syncNetworkSelection(idx: number): NetworkSelection {
    let me = this,
      target: NetworkModel,
      nsRecovery = me.networkSelections[idx] && me.networkSelections[idx].recovery ?
        me.networkSelections[idx].recovery : '',
      nsTest = me.networkSelections[idx] && me.networkSelections[idx].test ?
        me.networkSelections[idx].test : '',
      selection: NetworkSelection = {production: '', test: ''};
    if (me.networks && (nsRecovery || nsTest)) {
      if (nsRecovery) {
        target = me.networks.find(function (net) {
          return nsRecovery === net.getUrl('self');
        });
        if (target)
          selection.production = target.name;
        else if (me.syncReady)
          me.networkSelections[idx].recovery = selection.production;
      }
      if (nsTest) {
        target = me.networks.find(function (net) {
          return nsTest === net.getUrl('self');
        });
        if (target)
          selection.test = target.name;
        else if (me.syncReady)
          me.networkSelections[idx].test = selection.test;
      }
      if (me.syncReady)
        me.syncReady = false;
    }
    return selection;
  }
}
