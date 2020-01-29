import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreAwsec2Model} from '../snapshot-restore-awsec2.model';
import * as _ from 'lodash';
import {DatastoreComponent} from 'app/manage-protection/hypervisor/restore/datastore/datastore.component';

@Component({
  selector: 'snapshot-restore-awsec2-datastore',
  templateUrl: './snapshot-restore-awsec2-datastore.component.html',
  styleUrls: ['../snapshot-restore-awsec2.scss']
})
export class SnapshotRestoreAwsec2DatastoreComponent extends WizardPage<SnapshotRestoreAwsec2Model> {
  @ViewChild(DatastoreComponent) datastoreComponent: DatastoreComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private summaryPayload: any;

  validate(silent: boolean): boolean {
    if (!this.showDatastoreCard()) {
      return true;
    }
    this.model.mapDatastorePayload = this.getVolumeMappings();
    if (this.datastoreComponent) {
      this.summaryPayload = this.datastoreComponent.getSummaryText();
    }
    return this.datastoreComponent && this.datastoreComponent.isValid(this.model.mapDatastorePayload, true);
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  private getVolumeMappings() {
    if (this.datastoreComponent) {
      let datastore = this.datastoreComponent.getValue();
      return _.isEmpty(datastore) ? undefined : datastore;
    }
  }

  private showDatastoreCard(): boolean {
    return !this.model.originalHostCluster && this.model.workflowType !== 'IA';
  }
}
