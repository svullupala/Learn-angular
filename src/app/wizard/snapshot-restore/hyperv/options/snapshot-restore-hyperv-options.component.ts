import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreHypervModel} from '../snapshot-restore-hyperv.model';
import {BasicDynamicForm} from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import {RegistrationFormQuestion} from 'shared/form-question/form-question';
import {HypervisorRestoreService} from 'app/manage-protection/hypervisor/restore/hypervisor-restore.service';
import {HypervisorRestoreOptionsModel} from 'app/manage-protection/hypervisor/shared/hypervisor-restore-options.model';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {SessionService} from 'core';
import {Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'snapshot-restore-hyperv-options',
  templateUrl: './snapshot-restore-hyperv-options.component.html',
  styleUrls: ['../snapshot-restore-hyperv.scss']
})
export class SnapshotRestoreHypervOptionsComponent extends WizardPage<SnapshotRestoreHypervModel>
  implements OnInit {
  @ViewChild(BasicDynamicForm) optionForm: BasicDynamicForm;
  @ViewChild('summary', {read: TemplateRef})

  private _summary: TemplateRef<any>;
  private formValues: Array<RegistrationFormQuestion>;
  private transSub: Subscription;
  private infoTitle: string;
  private textOverwriteWarning: string;
  private overwriteWarningShown: boolean = false;

  constructor(private translate: TranslateService,
              private hypervisorRestoreService: HypervisorRestoreService) {
    super();
  }

  ngOnInit(): void {
    let me = this;
    me.model.workflowType === HypervisorRestoreService.IA_VAL ?
      me.formValues = me.hypervisorRestoreService.getIAForm(true, me.model.options) :
      me.formValues = me.hypervisorRestoreService.getIVForm(true);
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.transSub = me.translate.get([
      'common.infoTitle',
      'hypervisor.textOverwriteConfirmation'
    ])
      .subscribe((resource: Object) => {

        me.infoTitle = resource['common.infoTitle'];
        me.textOverwriteWarning = resource['hypervisor.textOverwriteConfirmation'];
      });
  }

  validate(silent: boolean): boolean {
    return true;
  }

  get isIAWorkflow(): boolean {
    return this.model.workflowType === HypervisorRestoreService.IA_VAL;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (!me.formValues)
      me.formValues =
        me.hypervisorRestoreService.getOptionsForm(me.model.options, me.model.workflowType,
          false, me.model.runType);
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this, model = me.model, policy = model.policy,
      subPolicy = policy.spec.subpolicy[0];
    subPolicy.option = me.getOptions();
  }

  private getOptions(): object {
    let options, data = this.optionForm.getValue();
    try {
      options = <HypervisorRestoreOptionsModel> JsonConvert.deserializeObject(data, HypervisorRestoreOptionsModel);
    } catch (e) {
    }
    options = this.fixOptions(options);
    this.model.options = options;
    if (this.model.options.allowvmoverwrite && !this.overwriteWarningShown) {
      this.alert.show(this.infoTitle, this.textOverwriteWarning);
      this.overwriteWarningShown = true;
    }
    return options;
  }

  private fixOptions(options: HypervisorRestoreOptionsModel): HypervisorRestoreOptionsModel {
    if (this.model.runType !== HypervisorRestoreService.IA_VAL) {
      options.mode = this.model.runType;
      options.vmscripts = false;
      options.IR = false;
    } else if (this.model.runType === HypervisorRestoreService.IA_VAL) {
    }
    options.protocolpriority = HypervisorRestoreService.iSCSIVal;

    if (options && (options.vmNameSuffix === '' || options.vmNameSuffix === null)) {
      options.vmNameSuffix = undefined;
    }
    if (options && (options.vmNamePrefix === '' || options.vmNamePrefix === null)) {
      options.vmNamePrefix = undefined;
    }
    return options;
  }

  private setOptions(option: object): void {
    let me = this;
    me.optionForm.patchValue(option);
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0];

    me.setOptions(subpolicy.option);
  }
}
