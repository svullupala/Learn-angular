import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';
import {DefineSchedule} from 'shared/components/define-schedule/define-schedule.component';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {ApplicationBackupOptionsPage} from
  'applications/backup/application-backup-options/application-backup-options-page';

@Component({
  selector: 'kubernetes-backup-options',
  templateUrl: 'kubernetes-backup-options.component.html',
  styleUrls: ['kubernetes-backup-options.component.scss']
})

export class KubernetesBackupOptionsComponent extends
  ApplicationBackupOptionsPage<ApplicationBackupOptionsModel> implements OnInit {
  @Input() model: ApplicationBackupOptionsModel;
  @ViewChild(DefineSchedule) defineScheduleComponent: DefineSchedule;

  private enableLogBackup: boolean = false;
  private purgePrimaryLogs: boolean = false;

  constructor() {
    super();
  }

  ngOnInit() {
    let me = this;
    if (!me.model)
    me.model = new ApplicationBackupOptionsModel();
  }

  setOptions(options?: ApplicationBackupOptionsModel): void {
    if (options === undefined || options.isEmpty()) {
      this.enableLogBackup = false;
      this.purgePrimaryLogs = false;
      if (this.defineScheduleComponent) {
        this.defineScheduleComponent.resetSchedule();
      }
      this.model = new ApplicationBackupOptionsModel();
    } else {
      this.model = options;
      this.enableLogBackup = options.isLogbackupEnabled;
      this.purgePrimaryLogs = options.purgePrimaryLogs;

      if (this.enableLogBackup) {
        let model: ScheduleModel = new ScheduleModel(),
          activateDate: number = options.activateDate;
        model.activateDate = activateDate;
        model.frequency = options.frequency;
        model.type = options.scheduleFrequencyType;
        if (this.defineScheduleComponent) {
          this.defineScheduleComponent.setModel(model);
          this.defineScheduleComponent.parseDate();
        }
      }
    }
  }

  getOptions(): ApplicationBackupOptionsModel {
    let me = this;
    me.model.excludeLogbackup = false;
    me.setLogbackUpValue();

    return me.model;
  }

  public isValid(): boolean {
    return this.enableLogBackup ? (this.defineScheduleComponent && this.defineScheduleComponent.isValid()) : true;
  }

  private setLogbackUpValue() {
    let schVal: object = this.defineScheduleComponent && this.defineScheduleComponent.getSchedule();

    this.model.setPerformLogbackup(this.enableLogBackup);
    this.model.purgePrimaryLogs = this.purgePrimaryLogs;

    this.model.rpo.activateDate = schVal['activateDate'];
    this.model.setFrequency(schVal['frequency']);
    this.model.setFrequencyType(schVal['type']);
    this.model.setTriggerTime(schVal['activateDate']);
  }

}
