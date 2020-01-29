import {Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreKubernetesModel} from '../snapshot-restore-kubernetes.model';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {
  ApplicationMappingTableComponent
} from 'app/manage-protection/applications/restore/application-mapping-table/application-mapping-table.component';

@Component({
  selector: 'snapshot-restore-kubernetes-run-type',
  templateUrl: './snapshot-restore-kubernetes-run-type.component.html',
  styleUrls: ['../snapshot-restore-kubernetes.scss']
})
export class SnapshotRestoreKubernetesRunTypeComponent extends WizardPage<SnapshotRestoreKubernetesModel> {
  @ViewChild(ApplicationMappingTableComponent) restoreMappingTable: ApplicationMappingTableComponent;

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  get applicationType(): string {
    return this.model.workflow;
  }

  constructor(private applicationRestoreService: ApplicationRestoreService) {
    super();
  }

  validate(silent: boolean): boolean {
    return !!this.model.runType && this.validMapping();
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    me.updateMappingTable();
    if (me.model.isSystemDbFlag) {
      me.model.runType = ApplicationRestoreService.IA_VAL;
    }
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
    if (!me.isIaType() && me.restoreMappingTable)
      me.restoreMappingTable.initPathsAsNeeded();
  }

  private updateMappingTable(): void {
    let me = this;
    if (me.restoreMappingTable)
      me.restoreMappingTable.update(me.model.source);
  }

  private setRestoreType(): void {
    this.model.subPolicyType = ApplicationRestoreService.RESTORE_VAL;
  }

  private setIaType(): void {
    this.model.subPolicyType = ApplicationRestoreService.IA_VAL;
  }

  private hideMappingsTable(): boolean {
    return (this.model.subPolicyType === 'IA');
  }

  private isIaType(): boolean {
    return this.model.runType === ApplicationRestoreService.IA_VAL;
  }

  private disableNameMapping(): boolean {
    return false;
  }

  private hidePathRenaming(): boolean {
    return this.model.runType !== 'production';
  }

  private validMapping(): boolean {
    let me = this,
      model = me.model,
      valid = true,
      mappings: boolean = true,
      product: boolean = false, mappingInfo;

    if (!me.isIaType()) {
      product = model.runType === 'production';
      mappingInfo = me.getMappingsValue(product);
      mappings = me.restoreMappingTable.checkMappings(mappingInfo);

      if (!mappings) {
        valid = false;
      }
    }
    return valid;
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

  private saveOptions(): void {
    let me = this,
      model = me.model,
      mappingsValue: object = model.originalLocation
        ? me.getMappingsValue(
          true,
          me.treatDestinationSameAsSource()
          )
        : me.getMappingsValue();

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
