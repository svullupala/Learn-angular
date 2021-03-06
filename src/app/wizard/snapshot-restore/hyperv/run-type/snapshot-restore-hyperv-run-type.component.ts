import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {HypervisorRestoreSelectionTableComponent, RestoreItem} from 'hypervisor/restore';

@Component({
  selector: 'snapshot-restore-hyperv-run-type',
  templateUrl: './snapshot-restore-hyperv-run-type.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervRunTypeComponent extends WizardPage<SnapshotRestoreHypervModel> {
  @ViewChild(HypervisorRestoreSelectionTableComponent) restoreSelectionTable: HypervisorRestoreSelectionTableComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  validate(silent: boolean): boolean {
    return !!this.model.runType;
  }

  get isIaRestore(): boolean {
    return this.model.workflowType === HypervisorRestoreService.IA_VAL;
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (this.model.workflowType === HypervisorRestoreService.IA_VAL){
      this.model.runType = HypervisorRestoreService.IA_VAL;
    } else {
      this.updateRestoreTable();
    }
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  onDeactive(): void {
    if (this.model.sourceType !== 'vdisk'){
      this.model.mapVMNamePayload = this.getVMMNameMappings();
    }
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  private updateRestoreTable(): void {
    let me = this;
    me.restoreSelectionTable.removeAll(true);
    this.model.source.forEach(function (source) {
      me.restoreSelectionTable.add(source, true);
    });
  }

  private getVMMNameMappings(): object {
    let me = this, payload = {};
    me.model.source.forEach(function (sourceSelection: RestoreItem) {
      if (sourceSelection.mapName !== '') {
        let href = sourceSelection.resource.url;
        payload[href] = {
          name: sourceSelection.mapName
        };
      }
    });
    return payload;
  }

  private getTypeString(): string {
    switch (this.model.runType) {
      case 'test':
        return 'hypervisor.textTest';
      case 'IA':
        return 'application.textInstantAccess';
      case 'clone':
        return 'hypervisor.textClone';
      case 'recovery':
        return 'hypervisor.textProduction';
      default:
        return 'wizard.job.textEmpty';
    }
  }

  private setVMMNameMappings(mapVMNamePayload: object): void {
    let me = this;
    me.model.source.forEach(function (sourceSelection: RestoreItem) {
      let href = sourceSelection.resource.url,
        target = mapVMNamePayload[href];
      if (href && target) {
        sourceSelection.mapName = target.name;
      }
    });
  }

  private populateOptions(): void {
    let me = this,
      model = me.model;
    if (model.mapVMNamePayload)
      me.setVMMNameMappings(model.mapVMNamePayload);
  }
}
