import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreAwsec2Model} from '../snapshot-restore-awsec2.model';
import * as _ from 'lodash';
import {VirtualNetworkComponent} from 'app/manage-protection/hypervisor/restore/networks/networks.component';

@Component({
  selector: 'snapshot-restore-awsec2-network',
  templateUrl: './snapshot-restore-awsec2-network.component.html',
  styleUrls: ['../snapshot-restore-awsec2.scss']
})
export class SnapshotRestoreAwsec2NetworkComponent extends WizardPage<SnapshotRestoreAwsec2Model> {
  @ViewChild(VirtualNetworkComponent) networksComponent: VirtualNetworkComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private summaryPayload: any;
  validate(silent: boolean): boolean {
    let valid = true;
    if (this.showNetworkCard()) {
      if (this.model.originalHostCluster) {
        if (this.model.destination)
          this.model.destination['systemDefined'] = this.model.systemDefined;
      } else {
        this.model.mapNetworkPayload = this.getNetworkMappings();
        this.model.mapSubnetPayload = this.getSubnetMappings();
        if (this.networksComponent) {
          this.summaryPayload = this.networksComponent.getSummaryText();
        }
        valid = valid && this.model.mapNetworkPayload &&
          this.networksComponent.isValid(this.model.mapNetworkPayload, true);
        valid = valid && this.model.mapSubnetPayload &&
          this.networksComponent.isSubnetValid(this.model.mapSubnetPayload, true);
      }
    }
    return valid;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  private showNetworkCard(): boolean {
    return this.model.workflowType !== 'IA';
  }

  private getNetworkMappings() {
    if (this.networksComponent) {
      let networks = this.networksComponent.getValue();
      return _.isEmpty(networks) ? undefined : networks;
    }
  }

  private getSubnetMappings() {
    if (this.networksComponent) {
      let subnets = this.networksComponent.getSubnetValue();
      return _.isEmpty(subnets) ? undefined : subnets;
    }
  }
}
