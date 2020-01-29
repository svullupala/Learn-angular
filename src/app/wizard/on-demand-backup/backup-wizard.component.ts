import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AlertComponent} from 'app/shared/components';
import {SessionService} from 'core';
import {BackupWizardModel} from './backup-wizard.model';
import {BackupWizardRegistry} from './backup-wizard-registry';
import {WizardPageEventParam} from 'shared/components/wizard/wizard-page';

@Component({
  selector: 'backup-wizard',
  templateUrl: './backup-wizard.component.html',
  styleUrls: []
})
export class BackupWizardComponent implements OnInit {
  @Input() textBackToTarget: string;
  @Input() model: BackupWizardModel;

  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitEvent: EventEmitter<BackupWizardModel> = new EventEmitter<BackupWizardModel>();

  private alert: AlertComponent;

  constructor(public registry: BackupWizardRegistry) {
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

  onWizardSubmit(model: BackupWizardModel): void {
    let me = this;
    if (me.alert)
      me.alert.show('Wizard Result', JSON.stringify(model.json()));

    this.submitEvent.emit(model);
  }
}
