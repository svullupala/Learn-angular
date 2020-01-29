import {WizardModel} from 'shared/components/wizard/wizard.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';

export class BackupAwsec2Model extends WizardModel {
  hypervisorType: string = 'awsec2';
  selectedPolicy: SlapolicyModel;
  source: Array<BaseHypervisorModel> = new Array<BaseHypervisorModel>();
  payload: any;

  buildBackupList(): Array<String> {
    let me = this, names: string[] = [];
    this.source.forEach(function (item) {
      names.push(item.url);
    });
    return names;
  }

  buildPolicy() {
    this.payload =  {
      slaPolicyName: this.selectedPolicy.name,
      subtype: this.hypervisorType,
      resource: this.buildBackupList()
    };
    return this.payload;
  }

  json(): object {
    return {
      source: this.source,
      policy: this.selectedPolicy.getId()
    };
  }
}
