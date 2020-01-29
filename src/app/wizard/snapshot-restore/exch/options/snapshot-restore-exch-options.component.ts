import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreExchModel} from '../snapshot-restore-exch.model';
import {RegistrationFormQuestion} from 'shared/form-question/form-question';
import {ApplicationRestoreService} from 'app/manage-protection/applications/restore/application-restore.service';
import {BasicDynamicForm} from 'shared/basic-dynamic-form/basic-dynamic-form.component';
import {ErrorHandlerComponent} from 'app/shared/components';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from 'core';
import {ApplicationRestoreItem}
  from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import {ApplicationPitComponent}
  from 'app/manage-protection/applications/restore/application-pit/application-pit.component';
import {Subscription} from 'rxjs/Subscription';
import {AlertComponent} from 'shared/components';

@Component({
  selector: 'snapshot-restore-exch-options',
  templateUrl: './snapshot-restore-exch-options.component.html',
  styleUrls: ['../snapshot-restore-exch.scss']
})
export class SnapshotRestoreExchOptionsComponent extends WizardPage<SnapshotRestoreExchModel>
  implements OnInit {

  get applicationType(): string {
    return this.model.workflow;
  }

  @ViewChild(BasicDynamicForm) optionForm: BasicDynamicForm;

  alert: AlertComponent;
  errorHandler: ErrorHandlerComponent;

  @ViewChild(ApplicationPitComponent) pitComponent: ApplicationPitComponent;

  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  private formValues: Array<RegistrationFormQuestion>;

  get isOffload(): boolean {
    return this.model.isOffload;
  }

  get recurring(): boolean {
    return this.model.useLatest === true && this.model.onDemandPIT === false;
  }

  private infoTitle: string;
  private textOverwriteWarning: string;
  private overwriteWarningShown: boolean = false;
  private transSub: Subscription;

  get hidePit(): boolean {
    return this.isOffload === true;
  }

  constructor(private translate: TranslateService,
              private applicationRestoreService: ApplicationRestoreService) {
    super();
  }

  ngOnInit(): void {
    let me = this;

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.formValues = me.applicationRestoreService.getForm(me.model.workflow);
    me.transSub = me.translate.get([
      'common.infoTitle',
      'application.textOverwriteConfirmation'
    ])
      .subscribe((resource: Object) => {

        me.infoTitle = resource['common.infoTitle'];
        me.textOverwriteWarning = resource['application.textOverwriteConfirmation'];
      });
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  validate(silent: boolean): boolean {
    let me = this,
      option = me.getOptions(),
      appOption = option ? option['applicationOption'] : null;
    return (appOption ? me.validAppOption(appOption) : true);
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  get options(): any {
    return this.getOptions() || {};
  }

  get applicationOption(): any {
    return this.options.applicationOption;
  }

  get hasApplicationOption(): boolean {
    return !!this.options.applicationOption;
  }

  get hasMaxParallelStreams(): boolean {
    return this.model.runType === 'production';
  }

  get hasMountPathPrefix(): boolean {
    return this.model.runType === ApplicationRestoreService.IA_VAL &&
      this.model.subPolicyType === ApplicationRestoreService.IA_VAL;
  }

  get isSubPolicyTypeIA(): boolean {
    return this.model.subPolicyType === ApplicationRestoreService.IA_VAL;
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    me.initOptionForm();
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(true))
      me.saveOptions();
  }

  private validAppOption(appOpt: any): boolean {
    return (appOpt.maxParallelStreams === undefined ||
      Number.isInteger(appOpt.maxParallelStreams) && appOpt.maxParallelStreams >= 1);
  }

  private initOptionForm(): void {
    let me = this,
      mode = me.model.runType,
      type = me.model.subPolicyType,
      subOption = me.model.subOption;

    if (!me.formValues || !me.optionForm)
      return;

    me.optionForm.disableFormControl('continueonerror');
    me.optionForm.disableFormControl('allowsessoverwrite');

    if (mode === ApplicationRestoreService.IA_VAL && type === ApplicationRestoreService.IA_VAL) {
      me.optionForm.showElement('mountPathPrefix');
    }

    if (type === ApplicationRestoreService.IA_VAL) {
      me.optionForm.enableFormControl('mountPathPrefix');
    } else if (type === ApplicationRestoreService.RESTORE_VAL) {

      me.optionForm.disableFormControl('mountPathPrefix');
      subOption.maxParallelStreams = mode === 'production'
        ? (subOption.maxParallelStreams || 1)
        : undefined;
    }
    if (mode === 'test')
      subOption.overwriteExistingDb = false;
  }

  private getRestoreList(): Array<ApplicationRestoreItem> {
    return this.model.source;
  }

  private handleOlderPitSettings(item: ApplicationRestoreItem): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0];
    if (subpolicy.option['applicationOption']) {
      model.subOption.recoveryType = subpolicy
        .option['applicationOption']['recoverymode'] || model.subOption.recoveryType;
    }

    if (item && (item.pointInTime || item.transactionId)) {
      model.subOption.recoveryType = 'pitrecovery';
    }
  }

  private getOptions(): object {
    let me = this, model = me.model,
      subPolicyType = model.subPolicyType,
      form = me.optionForm, subOption = model.subOption,
      options: object = {}, mountPathPrefix, runType = model.runType;

    if (subPolicyType === ApplicationRestoreService.IA_VAL) {
      options = form.getValue();
      mountPathPrefix = options['mountPathPrefix'];
      options['mountPathPrefix'] = undefined;
      if (mountPathPrefix && mountPathPrefix !== '') {
        options['applicationOption'] = {mountPathPrefix: mountPathPrefix};
      }
    } else if (subPolicyType === ApplicationRestoreService.RESTORE_VAL) {
      subOption.maxParallelStreams = runType === 'production'
        ? subOption.maxParallelStreams
        : undefined;
      options = form.getValue();
      options['applicationOption'] = subOption.getPersistentJson();
    }
    me.fixOverwriteExistingDb(options);
    return options;
  }

  private fixOverwriteExistingDb(options: object): void {
    let applicationOption = options['applicationOption'];
    if (this.model.runType === 'test' && applicationOption && applicationOption['overwriteExistingDb'])
      applicationOption['overwriteExistingDb'] = false;
    if ( !this.overwriteWarningShown && applicationOption && applicationOption['overwriteExistingDb']) {
      this.alert.show(this.infoTitle, this.textOverwriteWarning);
      this.overwriteWarningShown = true;
    }
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      pitValue = me.pitComponent && me.pitComponent.getValue(),
      optionValue = me.getOptions();

    model.pitValue = pitValue;
    model.optionValue = optionValue;
  }

  private setOptions(option: object): void {
    let me = this;
    me.optionForm.patchValue(option);
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0],
      list: Array<ApplicationRestoreItem> = me.getRestoreList();

    me.setOptions(subpolicy.option);
    me.handleOlderPitSettings(list[0]);
    me.pitComponent.setPit(list[0]);
  }
}
