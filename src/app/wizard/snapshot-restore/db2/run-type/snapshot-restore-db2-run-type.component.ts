import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreDb2Model} from '../snapshot-restore-db2.model';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {
  ApplicationMappingTableComponent
} from 'app/manage-protection/applications/restore/application-mapping-table/application-mapping-table.component';
import * as _ from 'lodash';
import {ApplicationRestoreItem} from 'applications/restore/application-list-table/application-list-table.component';

@Component({
  selector: 'snapshot-restore-db2-run-type',
  templateUrl: './snapshot-restore-db2-run-type.component.html',
  styleUrls: ['../snapshot-restore-db2.scss']
})
export class SnapshotRestoreDb2RunTypeComponent extends WizardPage<SnapshotRestoreDb2Model> {
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
    let me = this;
    return (me.model.subPolicyType === 'IA')
     || (me.model.originalLocation
       && me.model.runType === 'production');
  }

  private disableNameMapping(): boolean {
    return false;
  }

  private isIaType(): boolean {
    return this.model.runType === ApplicationRestoreService.IA_VAL;
  }

  private hidePathRenaming(): boolean {
   return true;
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

  private hideRestoreType(): boolean {
    return this.model.originalLocation;
  }

  private treatDestinationSameAsSource(): boolean {
    let me = this, model = me.model;
    return model.originalLocation && model.runType === 'production';
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      defaultMappingsValueForProdOL = me.getDefaultMappingsValueForProdOL(),
      mappingsValue: object = model.originalLocation
        ? me.getMappingsValue(
          true,
          me.treatDestinationSameAsSource()
          )
        : me.getMappingsValue();

    model.mappingsValue = mappingsValue;
    model.defaultMappingsValueForProdOL = defaultMappingsValueForProdOL;
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      mappings = model.mappingsValue;

    me.restoreMappingTable.setMappings(mappings);
  }

  private getRestoreItemByHref(href: string): ApplicationRestoreItem {
    return (this.model.source || []).find(function (item) {
      return href === item.resource.getUrl('self');
    });
  }

  private getDefaultMappingsValueForProdOL(): object {
    let me = this, mapping =  _.cloneDeep(me.getMappingsValue(true, true));
    for (let property in mapping) {
      if (mapping.hasOwnProperty(property)) {
        let value = mapping[property], name: string = '', paths: {source: string, destination: string}[],
          target = me.getRestoreItemByHref(property);
        if (value) {
          if (target && target.resource)
            name = target.resource.name || '';
          value.name = name.toUpperCase();

          paths = value.paths || [];
          paths.forEach(function (item) {
            item.destination = item.source;
          });
        }
      }
    }
    return mapping;
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
