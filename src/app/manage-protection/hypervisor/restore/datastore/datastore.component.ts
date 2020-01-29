import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs/Subscription';
import {JsonConvert} from 'json2typescript';
import {NgForm} from '@angular/forms';

import {RestoreItem} from '../restore-item.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent, AlertType} from 'shared/components/msgbox/alert.component';
import {VmRecoveryPointsService} from '../../shared/vmrecoverypoints.service';
import {HypervisorRestoreService} from '../hypervisor-restore.service';
import {SessionService} from 'core';
import {HostModel} from '../../shared/host.model';
import {VolumesModel} from '../../shared/volumes.model';
import {VolumeModel} from '../../shared/volume.model';
import {SorterModel} from 'shared/models/sorter.model';
import * as _ from 'lodash';
import { HostUserModel } from '../host-cluster-table/host-cluster-table.component';
import { IdentityUserModel } from 'identity/shared/identity-user.model';
import { Subject } from 'rxjs/Subject';

export class DatastoreSelectionModel {
  public source: string;
  public destination: string;

  constructor(source: string, destination: string) {
    this.source = source;
    this.destination = destination;
  }
}

@Component({
  selector: 'datastore-component',
  templateUrl: 'datastore.component.html',
  styleUrls: ['./datastore.component.scss']
})

export class DatastoreComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('datastore') form: NgForm;
  @Input() sourceList: Array<RestoreItem>;
  @Input() datastoreSelections: Array<any> = [];

  private datastoreModelSelections: Array<DatastoreSelectionModel> = [];
  private datastores: Array<VolumeModel>;
  private sourceDatastores: Array<VolumeModel>;
  private subs: Subject<void> = new Subject<void>();
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private errorTitle: string;
  private textDatastoreErr: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private tableMask: boolean = false;
  private datastoreMask: boolean = false;
  private summaryArray: any[] = [];
  private sourceDatastoresReady: boolean;
  private datastoresReady: boolean;

  private get syncReady():  boolean {
    return this.sourceDatastoresReady && this.datastoresReady;
  }

  private set syncReady(value: boolean) {
    this.sourceDatastoresReady = value;
    this.datastoresReady = value;
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
      });
    me.hypervisiorRestoreService.updateDestinationHostClusterSub.takeUntil(me.subs).subscribe(
      (selection) => {
        me.getDatastores(selection);
        me.getSourceDatastores(me.sourceList);
      });
    me.hypervisiorRestoreService.updateDestinationEsxHostSub.takeUntil(me.subs).subscribe(
      (model: HostUserModel) => {
        me.getSourceDatastores(me.sourceList);
        me.getDatastores(model.host, model.user);
      });
    me.translate.get([
      'common.sourceText',
      'common.destinationText',
      'common.processingRequestMsg',
      'common.textConfirm',
      'common.infoTitle',
      'common.errorTitle',
      'hypervisor.textDatastoreErr'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.processingRequestMsg = resource['common.processingRequestMsg'];
      me.textConfirm = resource['common.textConfirm'];
      me.textDatastoreErr = resource['hypervisor.textDatastoreErr'];
      me.errorTitle = resource['common.errorTitle'];

      if (me.datastoreSelections) {
        me.datastoreModelSelections = me.setDataStoreModel(me.datastoreSelections);
        me.updateSelection();
      }
    });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['datastoreSelections'] && !changes['datastoreSelections'].isFirstChange()) {
      if (me.datastoreSelections)
        me.datastoreModelSelections = me.setDataStoreModel(me.datastoreSelections);
    }
  }

  public getValue(): Object {
    return this.form && this.form.value;
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
    if (me.summaryArray.length === 0 && me.sourceDatastores) {
      for (let i = 0; i < me.sourceDatastores.length; i++) {
        me.summaryArray.push({name: me.sourceDatastores[i].name, destination: ''});
      }
    }
    return me.summaryArray;
  }

  protected updateSelection(): void {
    let me = this;
    if (me.sourceDatastores && me.summaryArray.length === me.sourceDatastores.length) {
      for (let i = 0; i < me.sourceDatastores.length; i++) {
        let selection = me.syncDatastoreSelection(i);
        me.summaryArray[i]['destination'] = selection;
      }
    }
  }

  public isValid(destinations: Object, silent?: boolean): boolean {
    let valid: boolean = true;
    if (typeof destinations === 'object') {
      _.forIn(destinations, (value, key) => {
        if (destinations.hasOwnProperty(key)) {
          if (typeof destinations[key] !== 'string' ||
            ( typeof destinations[key] === 'string'
            && destinations[key].length < 1)) {
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

  public playbackDatastoreSelections(records: Array<RestoreItem>, mapRRPdatastore) {
    if (records) {
      this.sourceList = records;
      this.datastoreModelSelections = this.setDataStoreModel(mapRRPdatastore);
    }
  }

  private setDataStoreModel(datastoreSelections: any): Array<DatastoreSelectionModel> {
    let datastores: Array<DatastoreSelectionModel> = [];
    if (datastoreSelections) {
      for (let key in datastoreSelections) {
        if (datastoreSelections.hasOwnProperty(key)) {
          let model = new DatastoreSelectionModel(key, datastoreSelections[key]);
          datastores.push(model);
        }
      }
    }
    return datastores;
  }

  private getDatastores(altLocation: HostModel, user?: IdentityUserModel) {
    let me = this, linkName: string = 'volumes',
        url: string;
    if (user) {
      linkName = 'livevolumes';
    }
    if (altLocation && altLocation.hasLink(linkName)) {
      url = user ? (altLocation.getUrl(linkName) + `&hostuser=${user.id}`) : (altLocation.getUrl(linkName));
      this.datastoreMasked();
      this.vmService.getByUrl(url,
        [],
        [new SorterModel('name', 'ASC')]).takeUntil(this.subs)
        .subscribe (
          data => {
            let dataset = JsonConvert.deserializeObject (data, VolumesModel);
            this.datastores = dataset.records;
            me.datastoresReady = true;
            me.updateSelection();
            this.datastoreUnMasked();
          },
          err => {
            this.datastoreUnMasked();
            this.handleError(err);
          }
        );
    }
  }

  private getSourceDatastores(records: Array<RestoreItem>) {
    let me = this;
    if (records && records.length > 0) {
      this.mask();
      this.hypervisiorRestoreService.queryAssociatedWith(this.sourceList, 'volume')
        .takeUntil(this.subs).subscribe (
          data => {
            let dataset = JsonConvert.deserializeObject (data, VolumesModel);
            this.sourceDatastores = dataset.records;
            me.sourceDatastoresReady = true;
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
      me.alert.show(me.errorTitle, errMsg || me.textDatastoreErr, AlertType.ERROR);
    }
  }

  private datastoreMasked(): void {
    this.datastoreMask = true;
  }

  private datastoreUnMasked(): void {
    this.datastoreMask = false;
  }

  private mask() {
    this.tableMask = true;
  }

  private unmask() {
    this.tableMask = false;
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private syncDatastoreSelection(idx: number): string {
    let me = this,
      target: VolumeModel,
      destination = me.datastoreModelSelections[idx] && me.datastoreModelSelections[idx].destination ?
        me.datastoreModelSelections[idx].destination : '',
      selection: string = '';
    if (me.datastores && destination) {
      target = me.datastores.find(function (datastore) {
        return destination === datastore.getUrl('self');
      });
      if (target)
        selection = target.name;
      else if (me.syncReady)
        me.datastoreModelSelections[idx].destination = selection;

      if (me.syncReady)
        me.syncReady = false;
    }
    return selection;
  }
}
