import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {BackupAwsec2Model} from '../backup-awsec2.model';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {FilterModel} from 'shared/models/filter.model';

@Component({
  selector: 'backup-awsec2-source',
  templateUrl: './backup-awsec2-source.component.html',
  styleUrls: ['../backup-awsec2.scss']
})
export class BackupAwsec2SourceComponent extends WizardPage<BackupAwsec2Model> implements OnInit {
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  @ViewChild('backupSources') private backupSourceTable;
  @ViewChild('backupSelections') private backupSelectionTable;

  private filters: Array<FilterModel> = new Array<FilterModel>();

  get summaryValue(): string {
    let me = this, names: string[] = [], items = me.getBackupList();
    (items || []).forEach(function (item) {
      names.push(item.name);
    });
    return names.join(', ');
  }

  ngOnInit(): void {
    this.filters = [new FilterModel('storageProfileName', this.model.selectedPolicy.name)];
    this.backupSourceTable.setFilters(this.filters);
    this.backupSourceTable.searchVms('', this.model.hypervisorType);
  }

  onActive() {
    if (this.filters[0] && this.filters[0].value !== this.model.selectedPolicy.name) {
      this.model.source.splice(0);
      this.filters = [new FilterModel('storageProfileName', this.model.selectedPolicy.name)];
      this.backupSourceTable.setFilters(this.filters);
      this.backupSourceTable.searchVms('', this.model.hypervisorType);
    }
  }

  onDeactive(): void {
    this.model.source = this.getBackupList();
  }

  validate(silent: boolean): boolean {
    return this.getBackupList().length > 0;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  addSelection(source: BaseHypervisorModel) {
    this.backupSelectionTable.add(source);
  }

  onClearSearch() {
    this.backupSourceTable.setFilters(this.filters);
    this.backupSourceTable.searchVms();
  }

  startSearch(force?: boolean, namePattern?: string): void {
    let me = this, crumb;

    let removeAllFilters = !(namePattern && namePattern.length > 0);
    if (!force && removeAllFilters) {
      me.backupSourceTable.clearSearch();
    } else {
      if (me.backupSelectionTable) {
        me.backupSourceTable.setFilters(me.filters);
        me.backupSourceTable.searchVms(namePattern ? namePattern : '');
      }
    }
  }

  private getBackupList(): Array<BaseHypervisorModel> {
    let me = this;
    if (me.backupSelectionTable)
      return me.backupSelectionTable.getValue();
    return [];
  }
}
