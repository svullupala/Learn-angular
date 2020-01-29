import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import * as _ from 'lodash';
import {DatastoreComponent} from 'app/manage-protection/hypervisor/restore/datastore/datastore.component';

@Component({
  selector: 'snapshot-restore-hyperv-datastore',
  templateUrl: './snapshot-restore-hyperv-datastore.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervDatastoreComponent extends WizardPage<SnapshotRestoreHypervModel> {
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
