import {Component, OnDestroy, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreSqlModel} from '../snapshot-restore-sql.model';
import {
  ApplicationRestoreItem
} from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import {TranslateService} from '@ngx-translate/core';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {FilterModel} from 'shared/models/filter.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {InstancesModel} from 'app/manage-protection/applications/shared/instances.model';
import {
  ApplicationDestinationTableComponent
}
from 'app/manage-protection/applications/restore/application-destination-table/application-destination-table.component';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'snapshot-restore-sql-destination',
  templateUrl: './snapshot-restore-sql-destination.component.html',
  styleUrls: ['../snapshot-restore-sql.scss']
})
export class SnapshotRestoreSqlDestinationComponent extends WizardPage<SnapshotRestoreSqlModel> implements OnDestroy {
  get applicationType(): string {
    return this.model.workflow;
  }
  get views(): NvPairModel[] {
    return this.model.views;
  }
  set views(views: NvPairModel[]) {
    this.model.views = views;
  }
  get view(): NvPairModel {
    return this.model.view;
  }
  get destinationView(): NvPairModel {
    let view = this.view,
      runType = this.model.runType;
    if (view.value === InstancesModel.DATABASE_GROUP_VIEW
      && runType === 'test') {
      return this.views[0];
    } else {
      return view;
    }
  }
  get targetLocation(): string { return this.model.targetLocation; }
  set targetLocation(value: string) { this.model.targetLocation = value; }
  get hasMultipleVersions(): boolean { return this.model.hasMultipleVersions; }

  @ViewChild(ApplicationDestinationTableComponent) restoreDestinationTable: ApplicationDestinationTableComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private filters: Array<FilterModel> = [];
  private subscriptions: Subscription[] = [];

  private get originalLocation(): boolean {
    return this.targetLocation === 'original' || this.targetLocation === 'originalPrimary';
  }

  constructor(private translate: TranslateService,
              private applicationRestoreService: ApplicationRestoreService) {
    super();
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.subscriptions)
      me.unsubscribe(me.subscriptions);
  }

  validate(silent: boolean): boolean {
    return this.originalLocation || !!this.getDestinationValue() && this.alternateAagDestValid();
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;

    if (firstTime) {
      // Publish the invalidDestination subject.
      me.publish<string>({
        invalidDestination: {
          initValue: null
        }
      });
      // Subscribe the view subject.
      me.subscriptions.push(...me.subscribe<NvPairModel>({
        view: {
          fn: (value: NvPairModel) => {
            // NULL indicates no change.
            if (value)
              me.handleViewChange(value);
          },
          scope: me
        }
      }));
      // Subscribe the runType subject.
      me.subscriptions.push(...me.subscribe<string>({
        runType: {
          fn: (value: string) => {
            // NULL indicates no change.
            if (value)
              me.handleRunTypeChange(value);
          },
          scope: me
        }
      }));

    }

    if (me.editMode && firstTime)
      me.populateOptions();
    me.checkTargetLocationForSqlAag();
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

  private alternateAagDestValid(): boolean {
    let me = this, valid = true;
    if (me.isSqlAag() && !me.originalLocation && me.model.runType === 'production') {
      valid = me.restoreDestinationTable.getDbGroupValue() !== undefined;
    }
    return valid;
  }

  private handleViewChange(view: NvPairModel): void {
    this.handleSubjectsChange(view, this.model.runType);
  }

  private handleRunTypeChange(runType: string): void {
    this.handleSubjectsChange(this.view, runType, true);
  }

  private handleSubjectsChange(view: NvPairModel, runType: string, notifyIfInvalid?: boolean): void {
    let me = this;
    if (view.value === InstancesModel.DATABASE_GROUP_VIEW
      && runType === 'test') {
      me.restoreDestinationTable.setView(me.views[0]);
    } else {
      me.restoreDestinationTable.setView(view);
    }
    me.restoreDestinationTable.osType = me.extractOsType(me.model.source);
    me.restoreDestinationTable.loadData(undefined, undefined, undefined, () => {
      if (notifyIfInvalid && !me.validate(true))
        me.notify<string>('invalidDestination', me.pageKey);
    });
  }

  private getDestinationValue(): object {
    return this.restoreDestinationTable && this.restoreDestinationTable.getValue();
  }

  private isSqlAag(): boolean {
    return this.view && this.view.value === InstancesModel.DATABASE_GROUP_VIEW;
  }

  private isSql(): boolean {
    return true;
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

  private checkTargetLocationForSqlAag() {
    if (this.isSqlAag() && (this.targetLocation === 'original' || this.targetLocation === 'originalPrimary')) {
      this.targetLocation = this.model.runType === 'test' ? 'original' : 'originalPrimary';
    } else if (this.isSql() && this.targetLocation === 'originalPrimary') {
      this.targetLocation = 'original';
    }
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
    model.dbGroupValue =  me.getDbGroupValue();
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

    me.targetLocation =  (destinationInstance || destinationGroup) ? 'alternate' :
      (me.isSqlAag() ? 'originalPrimary' : 'original');

    if (!me.originalLocation) {
      me.restoreDestinationTable.osType = me.extractOsType(me.model.source);
      me.restoreDestinationTable.setTarget(destinationInstance['href'],
        destinationGroup ? destinationGroup['href'] : undefined);
    }
  }
}
