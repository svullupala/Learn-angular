import {WizardModel} from 'shared/components/wizard/wizard.model';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';

export class BackupOracleModel extends WizardModel {
  applicationType: string = 'oracle';
  selectedPolicy: SlapolicyModel;
  source: Array<BaseApplicationModel> = new Array<BaseApplicationModel>();
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
      subtype: this.applicationType,
      resource: this.buildBackupList()
    };
    return this.payload;
  }

  json(): object {
    return {
      source: this.source,
    };
  }
}
