import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreVmwareModel} from '../snapshot-restore-vmware.model';
import {HostClusterTableComponent, TargetModel}
  from 'app/manage-protection/hypervisor/restore/host-cluster-table/host-cluster-table.component';
import {SessionService} from 'core';
import {TranslateService} from '@ngx-translate/core';
import {AlertComponent} from 'shared/components';
import * as _ from 'lodash';
import {VdiskComponent} from 'hypervisor/restore/vdisk/vdisk.component';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';

@Component({
  selector: 'snapshot-restore-vmware-destination',
  templateUrl: './snapshot-restore-vmware-destination.component.html',
  styleUrls: ['../snapshot-restore-vmware.scss']
})
export class SnapshotRestoreVmwareDestinationComponent extends WizardPage<SnapshotRestoreVmwareModel>
  implements OnInit {

  alert: AlertComponent;

  @ViewChild(VdiskComponent) vdiskTable: VdiskComponent;
  @ViewChild(HostClusterTableComponent) restoreDestinationTable: HostClusterTableComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private showEsxHostWarning: boolean = true;
  private deletedPages: string[];
  private target: TargetModel;

  private esxHostWarning: string;
  private infoTitle: string;
  private summaryPayload: any;

  constructor(private translate: TranslateService){
    super();
  }

  get destinationName(): string {
    let destination = this.restoreDestinationTable ? this.restoreDestinationTable.getValue() : null;
    return destination ? destination['target']['name'] : '';
  }

  ngOnInit(): void {
    let me = this;
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translate.get([
      'common.infoTitle',
      'hypervisor.textEsxHostWarning',
    ]).subscribe((resource: Object) => {
      me.infoTitle = resource['common.infoTitle'];
      me.esxHostWarning = resource['hypervisor.textEsxHostWarning'];
    });
    if (me.editMode)
      me.populateOptions();
  }

  validate(silent: boolean): boolean {
    let me = this, valid = true, destination: object;
    if (me.model.originalHostCluster) {
      return valid;
    } else {
      destination = me.getDestinationValue();
      valid = !!destination;
    }

    if (this.showVdiskCard()) {
      this.model.mapvdiskPayload = this.getVdiskMapping();
      valid = valid && this.model.mapvdiskPayload && this.vdiskTable.isValid(this.model.mapvdiskPayload, true);
    }
    return valid;
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (firstTime)
      me.spliceSteps(this.model.originalHostCluster);
  }

  onDeactive(): void {
    this.saveDestination();
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  onHostClusterClick(isOriginal: boolean): void {
    this.model.originalHostCluster = isOriginal;

    if (this.model.destinationType === 'esx' && this.showEsxHostWarning) {
      this.showEsxHostWarning = false;
      this.alert.show(this.infoTitle, this.esxHostWarning);
    }

    this.spliceSteps(isOriginal);
  }

  /**
   * Splice steps.
   * If select original host/cluster,
   * the step to configure datastore is not necessary.
   *
   * @param {boolean} isOriginal
   */
  private spliceSteps(isOriginal: boolean): void {
    let me = this, deletedPages: string[];
    if (isOriginal) {
      deletedPages = me.splicePages('datastore', 1);
      if (deletedPages && deletedPages.length > 0) {
        me.deletedPages = deletedPages;
        me.model.clearDatastore();
      }
    } else if (me.deletedPages && me.deletedPages.length > 0) {
      me.splicePages('network', 0, ...me.deletedPages);
      me.deletedPages = undefined;
    }
  }

  private getSummaryText(): any[] {
    let me = this;
    if (me.vdiskTable) {
      me.summaryPayload = me.vdiskTable.getSummaryText();
    }
    return me.summaryPayload;
  }


  private getDestinationValue(): object {
    let me = this;
    if (!me.model.originalHostCluster) {
      return me.restoreDestinationTable && me.restoreDestinationTable.getValue();
    } else if (me.model.originalHostCluster && me.model.workflowType === 'IV') {
        return {
          systemDefined: true
        };
    }
  }

  private saveDestination(selectedItem?: BaseHypervisorModel): void {
    let me = this;
    if (selectedItem) {
      me.model.isAWSDest = !!selectedItem.cloudType;
    }
    me.model.destination = me.getDestinationValue();
  }

  private getVdiskMapping() {
    if (this.vdiskTable) {
      let vdisk = this.vdiskTable.getValue();
      return _.isEmpty(vdisk) ? undefined : vdisk;
    }
  }

  private showVdiskCard(): boolean {
    return !this.model.originalHostCluster && this.model.workflowType === 'IA';
  }

  private populateOptions(): void {
    let me = this,
      originalHostCluster: boolean,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0],
      target: any;

    target = subpolicy.destination['target'];
    originalHostCluster =  !target;

    if (!originalHostCluster) {
      me.target = new TargetModel(target.name, target.resourceType, target.href);
      me.target.userHref = target.user;
    }
  }
}
