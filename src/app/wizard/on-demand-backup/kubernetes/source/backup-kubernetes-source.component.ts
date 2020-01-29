import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {BackupKubernetesModel} from '../backup-kubernetes.model';
import {FilterModel} from 'shared/models/filter.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {InstancesModel} from 'applications/shared/instances.model';

@Component({
  selector: 'backup-kubernetes-source',
  templateUrl: './backup-kubernetes-source.component.html',
  styleUrls: ['../backup-kubernetes.scss']
})

export class BackupKubernetesSourceComponent extends WizardPage<BackupKubernetesModel> implements OnInit {
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

    this.backupSourceTable.dbSearch(this.model.applicationType, 'hlo',
      {name: ''}, this.filters, true);
  }

  onActive() {
    if (this.filters[0] && this.filters[0].value !== this.model.selectedPolicy.name) {
      this.model.source.splice(0);
      this.filters = [new FilterModel('storageProfileName', this.model.selectedPolicy.name)];
      this.backupSourceTable.setFilters(this.filters);

      this.backupSourceTable.dbSearch(this.model.applicationType, 'hlo',
        {name: ''}, this.filters, true);
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

  addSelection(source: BaseApplicationModel) {
    this.backupSelectionTable.add(source);
  }

  onClearSearch() {
    this.backupSourceTable.setFilters(this.filters);
    this.backupSourceTable.dbSearch(this.model.applicationType, 'hlo',
      {name: ''}, this.filters, true);
  }

  startSearch(force?: boolean, namePattern?: string): void {
    let me = this, crumb;

    let removeAllFilters = !(namePattern && namePattern.length > 0);
    if (!force && removeAllFilters) {
      me.backupSourceTable.clearSearch();
    } else {
      if (me.backupSelectionTable) {
        me.backupSourceTable.setFilters(me.filters);

        this.backupSourceTable.dbSearch(this.model.applicationType, 'hlo',
          {name: namePattern ? namePattern : ''}, this.filters, true);
      }
    }
  }

  private getBackupList(): Array<BaseApplicationModel> {
    let me = this;
    if (me.backupSelectionTable)
      return me.backupSelectionTable.getValue();
    return [];
  }
}
