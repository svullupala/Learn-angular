import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreMongoModel} from '../snapshot-restore-mongo.model';
import {
  ApplicationRestoreItem
} from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {ApplicationService} from 'app/manage-protection/applications/shared/application.service';
import {FilterModel} from 'shared/models/filter.model';
import {
  ApplicationDestinationTableComponent
}
from 'app/manage-protection/applications/restore/application-destination-table/application-destination-table.component';

@Component({
  selector: 'snapshot-restore-mongo-destination',
  templateUrl: './snapshot-restore-mongo-destination.component.html',
  styleUrls: ['../snapshot-restore-mongo.scss']
})
export class SnapshotRestoreMongoDestinationComponent extends WizardPage<SnapshotRestoreMongoModel> {
  get applicationType(): string {
    return this.model.workflow;
  }

  get hasMultipleVersions() {
    return this.model.hasMultipleVersions;
  }

  @ViewChild(ApplicationDestinationTableComponent) restoreDestinationTable: ApplicationDestinationTableComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private filters: Array<FilterModel> = [];

  get targetLocation(): string { return this.model.targetLocation; }
  set targetLocation(value: string) { this.model.targetLocation = value; }

  private get originalLocation(): boolean {
    return this.targetLocation === 'original' || this.targetLocation === 'originalPrimary';
  }

  constructor(private translate: TranslateService,
              private applicationRestoreService: ApplicationRestoreService,
              private applicationService: ApplicationService) {
    super();
  }

  validate(silent: boolean): boolean {
    return this.originalLocation || !!this.getDestinationValue();
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(false))
      me.saveOptions();
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  get destinationName(): string {
    let instance = this.restoreDestinationTable ? this.restoreDestinationTable.getSelectedInstance() : null;
    return instance ? instance.name : '';
  }

  private getDestinationValue(): object {
    return this.restoreDestinationTable && this.restoreDestinationTable.getValue();
  }

  private isSqlAag(): boolean {
    return false;
  }

  private isSql(): boolean {
    return false;
  }

  private getRestoreList(): Array<ApplicationRestoreItem> {
    return this.model.source;
  }

  private onOriginalClick(value: string): void {
    this.targetLocation = value;
  }

  private onAlternateLocationClick(value: string): void {
    this.targetLocation = value;
    this.applicationRestoreService.filterInstances(this.getRestoreList());
  }

  private getDbGroupValue(): object {
    return this.restoreDestinationTable && this.restoreDestinationTable.getDbGroupValue();
  }

  private extractOsType(list: Array<ApplicationRestoreItem>): string {
    let target = (list || []).find(function(item) {
      let resource = item.resource;
      return resource && !!resource.osType;
    });
    return target && target.resource ? target.resource.osType : undefined;
  }

  private saveOptions(): void {
    let me = this,
      model = me.model;

    model.originalLocation = me.originalLocation;
    model.targetLocation = me.targetLocation;
    model.dbGroupValue = me.getDbGroupValue();
    model.destinationValue = me.getDestinationValue();
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0],
      destinationInstance: object,
      destinationGroup: object;

    destinationInstance = subpolicy.destination['target'];
    destinationGroup = subpolicy.destination['targetGroup'];

    me.targetLocation = (destinationInstance || destinationGroup) ? 'alternate' :
      (me.isSqlAag() ? 'originalPrimary' : 'original');

    if (!me.originalLocation) {
      me.restoreDestinationTable.osType = me.extractOsType(me.model.source);
      me.restoreDestinationTable.setTarget(destinationInstance['href'],
        destinationGroup ? destinationGroup['href'] : undefined);
    }
  }
}
