import {Component, TemplateRef, ViewChild, OnInit} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {WizardModel} from 'shared/components/wizard/wizard.model';
import {NvPairModel} from 'shared/models/nvpair.model';
import {SessionService, ScreenId} from 'core';

@Component({
  selector: 'workflow-selector',
  templateUrl: './workflow-selector.component.html',
  styleUrls: ['./workflow-selector.component.scss']
})
export class WorkflowSelectorComponent extends WizardPage<WizardModel> implements OnInit {

  protected entries: NvPairModel[] = [
    new NvPairModel('wizard.textVMware', {'type': 'vmware', 'category': 'hypervisor', 'screenId': ScreenId.VMWARE_RESTORE}),
    new NvPairModel('wizard.textHyperV', {'type': 'hyperv', 'category': 'hypervisor', 'screenId': ScreenId.HYPERV_RESTORE}),
    new NvPairModel('wizard.textAwsec2', {'type': 'awsec2', 'category': 'hypervisor', 'screenId': ScreenId.AWSEC2_RESTORE}),
    new NvPairModel('wizard.textDB2', {'type': 'db2', 'category': 'application', 'screenId': ScreenId.DB2_RESTORE}),
    new NvPairModel('wizard.textSQL', {'type': 'sql', 'category': 'application', 'screenId': ScreenId.SQL_RESTORE}),
    new NvPairModel('wizard.textOracle', {'type': 'oracle', 'category': 'application', 'screenId': ScreenId.ORACLE_RESTORE}),
    new NvPairModel('wizard.textMongo', {'type': 'mongo', 'category': 'application', 'screenId': ScreenId.MONGO_RESTORE}),
    new NvPairModel('wizard.textExchange', {'type': 'exch', 'category': 'application', 'screenId': ScreenId.EXCH_RESTORE}),
    new NvPairModel('wizard.textExchangeOnline', {'type': 'office365', 'category': 'application', 'screenId': ScreenId.EXCHONLINE_RESTORE}),
    new NvPairModel('wizard.textKubernetes', {'type': 'k8s', 'category': 'application', 'screenId': ScreenId.KUBERNETES_RESTORE})
  ];

  protected applicableEntries: NvPairModel[] = [];

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  private session: SessionService = undefined;
  private hasHypervisor: boolean = true;
  private hasApplication: boolean = true;

  isSelected(entry: NvPairModel): boolean {
    return entry.value.type === this.model.workflow;
  }

  onEntryClick(entry: NvPairModel): void {
    this.model.workflow = entry.value.type;
    this.wizard.setWorkflow(this.model.workflow);
  }

  validate(silent: boolean): boolean {
    return !!this.model.workflow;
  }

  public onActive(param: WizardPageEventParam): void {
    let me = this, applicableEntries = [], wizard = param.wizard,
      workflows = wizard.applicableWorkflows;
    me.hasApplication = false;
    me.hasHypervisor = false;
    me.entries.forEach(function (entry) {
      if (workflows.indexOf(entry.value.type) !== -1 && this.session.hasScreenPermission(entry.value.screenId)) {
          if (entry.value.category === 'hypervisor') {
            this.hasHypervisor = true;
          }
          if (entry.value.category === 'application') {
            this.hasApplication = true;
          }
          applicableEntries.push(entry);
        }
    }, this);
    me.applicableEntries = applicableEntries;
    me.wizard = wizard;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  get workflow(): string {
    let me = this, target = this.entries.find(function (item) {
      return item.value.type === me.model.workflow;
    });
    return target ? target.name : '';
  }

  ngOnInit(): void {
    this.session = SessionService.getInstance();
  }
}
