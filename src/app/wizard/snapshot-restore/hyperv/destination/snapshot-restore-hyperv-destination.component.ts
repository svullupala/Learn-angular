import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import {HostClusterTableComponent, TargetModel}
  from 'app/manage-protection/hypervisor/restore/host-cluster-table/host-cluster-table.component';
import * as _ from 'lodash';
import {VdiskComponent} from 'hypervisor/restore/vdisk/vdisk.component';

@Component({
  selector: 'snapshot-restore-hyperv-destination',
  templateUrl: './snapshot-restore-hyperv-destination.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervDestinationComponent extends WizardPage<SnapshotRestoreHypervModel>
  implements OnInit {
  @ViewChild(VdiskComponent) vdiskTable: VdiskComponent;
  @ViewChild(HostClusterTableComponent) restoreDestinationTable: HostClusterTableComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private showEsxHostWarning: boolean = true;
  private deletedPages: string[];
  private target: TargetModel;

  get destinationName(): string {
    let destination = this.restoreDestinationTable ? this.restoreDestinationTable.getValue() : null;
    return destination ? destination['target']['name'] : '';
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

  ngOnInit(): void {
    let me = this;
    if (me.editMode)
      me.populateOptions();
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
      this.info('insert esx host waring', 'insert title');
    }

    this.spliceSteps(isOriginal);
  }

  /**
   * Splice steps.
   * If select original host/cluster,
   * the steps to configure datastore and network are not necessary.
   *
   * @param {boolean} isOriginal
   */
  private spliceSteps(isOriginal: boolean): void {
    let me = this, deletedPages: string[];
    if (isOriginal) {
      deletedPages = me.splicePages('datastore', 2);
      if (deletedPages && deletedPages.length > 0) {
        me.deletedPages = deletedPages;
        me.model.clearDatastoreNetwork();
      }
    } else if (me.deletedPages && me.deletedPages.length > 0) {
      me.splicePages('run-type', 0, ...me.deletedPages);
      me.deletedPages = undefined;
    }
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

  private saveDestination(): void {
    let me = this;

    me.model.destination = me.getDestinationValue();
  }

  private showVdiskCard(): boolean {
    return !this.model.originalHostCluster && this.model.workflowType === 'IA';
  }

  private getVdiskMapping() {
    if (this.vdiskTable) {
      let vdisk = this.vdiskTable.getValue();
      return _.isEmpty(vdisk) ? undefined : vdisk;
    }
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
