import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AlertComponent} from 'shared/components';
import {SessionService} from 'core';
import {ConfigurationReportWizardModel} from './configuration-report-wizard.model';
import {ConfigurationReportWizardRegistry} from './configuration-report-wizard-registry';
import {WizardPageEventParam} from 'shared/components/wizard/wizard-page';

@Component({
  selector: 'configuration-report-wizard',
  templateUrl: './configuration-report-wizard.component.html',
  styleUrls: []
})
export class ConfigurationReportWizardComponent implements OnInit {
  @Input() textBackToTarget: string;
  @Input() model: ConfigurationReportWizardModel;

  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitEvent: EventEmitter<ConfigurationReportWizardModel> = new EventEmitter<ConfigurationReportWizardModel>();

  private alert: AlertComponent;

  constructor(public registry: ConfigurationReportWizardRegistry) {
  }

  ngOnInit(): void {
    let me = this;
    me.alert = SessionService.getInstance().context['msgbox.alert'];
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

  onWizardSubmit(model: ConfigurationReportWizardModel): void {
    let me = this;
    if (me.alert)
      me.alert.show('Wizard Result', JSON.stringify(model.json()));

    this.submitEvent.emit(model);
  }
}
