import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AlertComponent, AlertType, ErrorHandlerComponent, WizardStartPagesEventParam } from 'app/shared/components';
import { SessionService } from 'core';
import { JobWizardModel, JobWizardRegistry } from './job-wizard-registry';
import { WizardPageEventParam } from 'shared/components/wizard/wizard-page';
import { WIZARD_CATEGORY_BACKUP } from './on-demand-backup/backup-wizard.model';
import { WizardAllowedCategory, WizardCategory } from 'shared/components/wizard/wizard-registry';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';
import { JobModel } from 'job/shared/job.model';
import {WIZARD_CATEGORY_SNAPSHOT_RESTORE} from 'wizard/snapshot-restore/snapshot-restore-wizard.model';

@Component({
  selector: 'job-wizard',
  templateUrl: './job-wizard.component.html',
  styleUrls: ['./job-wizard.component.scss']
})
export class JobWizardComponent implements OnInit {

  @Input() textBackToTarget: string;
  @Input() autoShow: boolean = false;
  @Input() allowedCategories: WizardAllowedCategory[];
  @Input() isContentMaximized: boolean = false; // True indicates the content is maximized before open this wizard.

  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitEvent: EventEmitter<JobWizardModel> = new EventEmitter<JobWizardModel>();

  @ViewChild('starterDesc', { read: TemplateRef }) starterDesc: TemplateRef<any>;

  model: JobWizardModel;
  category: WizardCategory;
  showOverallSummary: boolean = true;
  enablePreview: boolean = false;
  textPreview: string = '';

  private alert: AlertComponent;
  private errorHandler: ErrorHandlerComponent;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textJobCreateSuccessfulTpl: string;
  private textJobCreateSuccessfulOnDemandTpl: string;
  private textJobUpdateSuccessfulTpl: string;
  private textBackup: string;
  private textRestore: string;
  private subs: Subject<void> = new Subject<void>();
  private active: boolean = false;

  constructor(private translate: TranslateService, public registry: JobWizardRegistry) {
  }

  mask() {
    let me = this;
    if (me.alert) {
      me.alert.show('', me.processingRequestMsg, AlertType.MASK);
    }
  }

  unmask() {
    let me = this;
    if (me.alert)
      me.alert.hide();
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.CONFIRMATION, handler, discardHandler);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit(): void {
    let me = this;
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.registry.description = me.starterDesc;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'wizard.job.textUpdateSuccessfulTpl',
      'wizard.job.textCreateSuccessfulTpl',
      'wizard.job.textCreateSuccessfulOnDemandTpl',
      'wizard.job.textBackup',
      'wizard.job.textRestore'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textJobUpdateSuccessfulTpl = resource['wizard.job.textUpdateSuccessfulTpl'];
        me.textJobCreateSuccessfulTpl = resource['wizard.job.textCreateSuccessfulTpl'];
        me.textJobCreateSuccessfulOnDemandTpl = resource['wizard.job.textCreateSuccessfulOnDemandTpl']
        me.textBackup = resource['wizard.job.textBackup'];
        me.textRestore = resource['wizard.job.textRestore'];
      });
    me.active = me.autoShow;
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onStartPages(payload: WizardStartPagesEventParam): void {
    let category = payload.category;
    this.showOverallSummary = false;
    this.updatePreviewParams(category);
    this.category = category;
  }

  onWizardBeforeCancel(payload: WizardPageEventParam): void {
    // TODO: If need to prevent cancel, simply set the preventNextEvent of payload to true.
    // Use the step index 2 as an example below.
    // if (payload.index === 2)
    //   payload.preventNextEvent = true;
  }

  onWizardCancel(): void {
    this.cancelEvent.emit();
  }

  onWizardSubmit(model: JobWizardModel): void {
    let me = this, tpl = model.editMode ? me.textJobUpdateSuccessfulTpl : 
      me.isShowTextRunningJobsInAlert(model) ? me.textJobCreateSuccessfulOnDemandTpl : me.textJobCreateSuccessfulTpl,
      msg = SharedService.formatString(tpl,
        me.category.type !== WIZARD_CATEGORY_BACKUP ? me.textRestore : me.textBackup);

    me.mask();
    me.registry.buildPolicy(me.category, model);

    // console.log(JSON.stringify(model.json()));

    me.registry.applyPolicy(me.category, model).takeUntil(me.subs).subscribe(
      () => {
        me.unmask();
        me.info(msg);
        me.hide();
        me.submitEvent.emit(model);
      },
      (err) => me.handleError(err, true)
    );
  }

  show(): void {
    this.active = true;
  }

  hide(): void {
    this.active = false;
  }

  create(): void {
    let me = this;
    me.model = undefined;
    me.registry.pickCreateMode(true);
    me.show();
  }

  edit(job: JobModel): void {
    let me = this;
    me.model = me.registry.pickEditMode(job);
    me.show();
  }

  private isShowTextRunningJobsInAlert(model: JobWizardModel): boolean {
    if (model && ((!model['useLatest'] && model['subOption'] && model['subOption']['recoveryType'] === 'recovery') 
    || (model['useLatest'] && model['recoveryType'] === 'pitrecovery'))) {
      return true;
    }    

    return false;
  }

  private updatePreviewParams(category: WizardCategory): void {
    let me = this;
    switch (category.type) {
      case WIZARD_CATEGORY_BACKUP:
        me.enablePreview = true;
        me.textPreview = 'wizard.job.textPreviewBackup';
        break;
      case WIZARD_CATEGORY_SNAPSHOT_RESTORE:
        me.enablePreview = true;
        me.textPreview = 'wizard.job.textPreviewRestore';
        break;
      default:
        me.enablePreview = false;
        me.textPreview = '';
        break;
    }
  }
}
