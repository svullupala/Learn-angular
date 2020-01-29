import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreSqlModel} from '../snapshot-restore-sql.model';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {
  ApplicationMappingTableComponent
} from 'app/manage-protection/applications/restore/application-mapping-table/application-mapping-table.component';
import {InstancesModel} from 'app/manage-protection/applications/shared/instances.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {AlertType} from 'app/shared/components';
import {Subject, Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from 'core';

@Component({
  selector: 'snapshot-restore-sql-run-type',
  templateUrl: './snapshot-restore-sql-run-type.component.html',
  styleUrls: ['../snapshot-restore-sql.scss']
})
export class SnapshotRestoreSqlRunTypeComponent extends WizardPage<SnapshotRestoreSqlModel>
  implements OnInit, OnDestroy {
  @ViewChild(ApplicationMappingTableComponent) restoreMappingTable: ApplicationMappingTableComponent;

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;
  private subscriptions: Subscription[] = [];
  private textBackToDestination: string;
  private infoTitle: string;
  private subs: Subject<void> = new Subject<void>();

  get applicationType(): string {
    return this.model.workflow;
  }
  get view(): NvPairModel {
    return this.model.view;
  }
  get targetLocation(): string { return this.model.targetLocation; }
  set targetLocation(value: string) { this.model.targetLocation = value; }

  constructor(private translate: TranslateService) {
    super();
  }

  ngOnInit(): void {
    let me = this;
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translate.get([
      'common.infoTitle',
      'wizard.job.textBackToDestination'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textBackToDestination = resource['wizard.job.textBackToDestination'];
      });
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.subs) {
      me.subs.next();
      me.subs.complete();
      me.subs.unsubscribe();
    }
    if (me.subscriptions)
      me.unsubscribe(me.subscriptions);
  }

  validate(silent: boolean): boolean {
    return !!this.model.runType;
  }

  info(message: string, title?: string, handler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message, AlertType.INFO);
    if (handler) {
      let subscriber = me.alert.hideEvent.subscribe(() => {
        subscriber.unsubscribe();
        handler.call(me);
      });
    }
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (me.model.isSystemDbFlag) {
      me.model.runType = ApplicationRestoreService.IA_VAL;
      me.setIaType();
    }
    if (firstTime) {
      // Subscribe the invalidDestination subject.
      me.subscriptions.push(...me.subscribe<string>({
        invalidDestination: {
          fn: (pageKey: string) => {
            if (pageKey)
              me.handleInvalidDestination(pageKey);
          },
          scope: me
        }
      }));
    }
    me.updateMappingTable();
    if (me.editMode && firstTime)
      me.populateOptions();
    if (firstTime)
      me.initMappingPaths();
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(true))
      me.saveOptions();
  }

  private initMappingPaths(): void {
    let me = this;
    if (me.restoreMappingTable)
      me.restoreMappingTable.initPathsAsNeeded();
  }

  private handleInvalidDestination(pageKey: string): void {
    let me = this;
    me.info(me.textBackToDestination, undefined, () => {
      me.backToPage(pageKey);
    });
  }

  private updateMappingTable(): void {
    let me = this;
    if (me.restoreMappingTable)
      me.restoreMappingTable.update(me.model.source);
  }

  private setRestoreType(): void {
    this.model.subPolicyType = ApplicationRestoreService.RESTORE_VAL;
    this.notify<string>('runType', this.model.runType);
  }

  private setIaType(): void {
    this.model.subPolicyType = ApplicationRestoreService.IA_VAL;
    this.notify<string>('runType', this.model.runType);
  }

  private hideMappingsTable(): boolean {
    return (this.model.subPolicyType === 'IA');
  }

  private disableNameMapping(): boolean {
    return false;
  }

  private hidePathRenaming(): boolean {
    return this.model.runType !== 'production';
  }

  private getMappingsValue(forcePaths?: boolean, treatDestinationSameAsSource?: boolean): object {
    return this.restoreMappingTable &&
      this.restoreMappingTable.getMappingValue(forcePaths, this.applicationType,
      treatDestinationSameAsSource);
  }

  private treatDestinationSameAsSource(): boolean {
    let me = this, model = me.model;
    return model.originalLocation && model.runType === 'production';
  }

  private isSqlAag(): boolean {
    return this.view && this.view.value === InstancesModel.DATABASE_GROUP_VIEW;
  }

  private isSql(): boolean {
    return true;
  }

  private checkTargetLocationForSqlAag() {
    if (this.isSqlAag() && (this.targetLocation === 'original' || this.targetLocation === 'originalPrimary')) {
      this.targetLocation = this.model.runType === 'test' ? 'original' : 'originalPrimary';
    } else if (this.isSql() && this.targetLocation === 'originalPrimary') {
      this.targetLocation = 'original';
    }
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      mappingsValue: object = model.originalLocation
        ? me.getMappingsValue(
          true,
          me.treatDestinationSameAsSource()
          )
        : me.getMappingsValue();

    me.checkTargetLocationForSqlAag();
    model.mappingsValue = mappingsValue;
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      mappings = model.mappingsValue;

    me.restoreMappingTable.setMappings(mappings);
  }

  private getTypeString(): string {
    switch (this.model.runType) {
      case 'test':
        return 'application.textTest';
      case 'IA':
        return 'application.textInstantAccess';
      case 'production':
        return 'application.textProduction';
      default:
        return 'wizard.job.textEmpty';
    }
  }
}
