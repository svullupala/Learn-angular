import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import {VirtualNetworkComponent} from 'app/manage-protection/hypervisor/restore/networks/networks.component';
import * as _ from 'lodash';

@Component({
  selector: 'snapshot-restore-hyperv-network',
  templateUrl: './snapshot-restore-hyperv-network.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervNetworkComponent extends WizardPage<SnapshotRestoreHypervModel> {
  @ViewChild(VirtualNetworkComponent) networksComponent: VirtualNetworkComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private summaryPayload: any;

  validate(silent: boolean): boolean {
    let valid = true;
    if (this.showNetworkCard()) {
      this.model.mapNetworkPayload = this.getNetworkMappings();
      if (this.networksComponent) {
        this.summaryPayload = this.networksComponent.getSummaryText();
      }
      valid = valid && this.model.mapNetworkPayload &&
        this.networksComponent.isValid(this.model.mapNetworkPayload, true);
    }
    return valid;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  private showNetworkCard(): boolean {
    return !this.model.originalHostCluster && this.model.workflowType !== 'IA';
  }

  private getNetworkMappings() {
    if (this.networksComponent) {
      let networks = this.networksComponent.getValue();
      return _.isEmpty(networks) ? undefined : networks;
    }
  }
}
