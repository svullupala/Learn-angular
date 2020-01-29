import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {AlertComponent, AlertType, ErrorHandlerComponent, WizardStartPagesEventParam} from 'shared/components';
import {SessionService} from 'core';
import {ReportWizardModel, ReportWizardRegistry} from './report-wizard-registry';
import {WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {WizardCategory} from 'shared/components/wizard/wizard-registry';
import {Subject} from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from 'shared/shared.service';
import {WIZARD_CATEGORY_CONFIGURATION_REPORT} from './system/configuration/configuration-report-wizard.model';

@Component({
  selector: 'report-wizard',
  templateUrl: './report-wizard.component.html',
  styleUrls: ['./report-wizard.component.scss']
})
export class ReportWizardComponent implements OnInit {
  @Input() textBackToTarget: string;
  @Input() model: ReportWizardModel;

  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitEvent: EventEmitter<ReportWizardModel> = new EventEmitter<ReportWizardModel>();

  @ViewChild('starterDesc', {read: TemplateRef}) starterDesc: TemplateRef<any>;

  category: WizardCategory;
  showOverallSummary: boolean = true;
  private alert: AlertComponent;
  private errorHandler: ErrorHandlerComponent;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private textJobCreateSuccessfulTpl: string;
  private textJobUpdateSuccessfulTpl: string;
  private textBackup: string;
  private textRestore: string;
  private subs: Subject<void> = new Subject<void>();

  constructor(private translate: TranslateService, public registry: ReportWizardRegistry) {
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
      'wizard.job.textBackup',
      'wizard.job.textRestore'
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {

        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textJobUpdateSuccessfulTpl = resource['wizard.job.textUpdateSuccessfulTpl'];
        me.textJobCreateSuccessfulTpl = resource['wizard.job.textCreateSuccessfulTpl'];
        me.textBackup = resource['wizard.job.textBackup'];
        me.textRestore = resource['wizard.job.textRestore'];
      });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onStartPages(payload: WizardStartPagesEventParam): void {
    let category = payload.category;
    this.showOverallSummary =
      [WIZARD_CATEGORY_CONFIGURATION_REPORT].indexOf(category.type) === -1;
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

  onWizardSubmit(model: ReportWizardModel): void {
    let me = this, tpl = model.editMode ? me.textJobUpdateSuccessfulTpl : me.textJobCreateSuccessfulTpl,
      msg = SharedService.formatString(tpl,
        me.category.type !== WIZARD_CATEGORY_CONFIGURATION_REPORT ? me.textRestore : me.textBackup);

    me.mask();
  }
}
