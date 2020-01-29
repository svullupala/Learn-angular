import {Component, TemplateRef, ViewChild} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {DefineSchedule} from 'app/shared/components';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';
import {SnapshotRestoreVmwareModel} from '../snapshot-restore-vmware.model';

@Component({
  selector: 'snapshot-restore-vmware-schedule',
  templateUrl: './snapshot-restore-vmware-schedule.component.html',
  styleUrls: ['../snapshot-restore-vmware.scss']
})
export class SnapshotRestoreVmwareScheduleComponent extends WizardPage<SnapshotRestoreVmwareModel> {
  @ViewChild(DefineSchedule) trigger: DefineSchedule;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  get scheduleName(): string {
    return this.model.scheduleName;
  }
  set scheduleName(value: string) {
    this.model.scheduleName = value;
  }
  get editMode(): boolean {
    return this.model.editMode;
  }
  get activateDate(): number {
    let trigger = this.getSchedule() as any;
    return trigger ? trigger.activateDate : null;
  }
  get rpo(): object {
    return { trigger: this.getSchedule() };
  }

  validate(silent: boolean): boolean {
    return this.model.useLatest ? this.scheduleName && this.trigger.isValid() : true;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  public onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;
    if (me.editMode && firstTime)
      me.populateOptions();
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(false))
      me.saveOptions();
  }

  public getSchedule(): object {
    return this.trigger && this.trigger.getSchedule();
  }

  private resetSchedule(): void {
    this.trigger.resetSchedule();
  }

  private setSchedule(trigger: Object): void {
    this.trigger.model = JsonConvert.deserializeObject(trigger, ScheduleModel);
    this.trigger.parseDate();
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      trigger = me.getSchedule();

    model.triggerValue = trigger;
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      trigger = model.triggerValue;
    if (trigger)
      me.setSchedule(trigger);
  }
}
