import {Component, Input, OnInit } from '@angular/core';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {ApplicationBackupOptionsPage} from
  'applications/backup/application-backup-options/application-backup-options-page';
import { AppState } from 'app/app.service';

@Component({
  selector: 'mongo-backup-options',
  templateUrl: 'mongo-backup-options.component.html'
})

export class MongoBackupOptionsComponent extends
  ApplicationBackupOptionsPage<ApplicationBackupOptionsModel> implements OnInit {
  @Input() model: ApplicationBackupOptionsModel;

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
      this.model = new ApplicationBackupOptionsModel();
    } else {
      this.model = options;
      this.enableLogBackup = options.isLogbackupEnabled;
      if (this.enableLogBackup) {
        let model: ScheduleModel = new ScheduleModel(),
          activateDate: number = options.activateDate;
        model.activateDate = activateDate;
        model.frequency = options.frequency;
        model.type = options.scheduleFrequencyType;
      }
    }
  }

  getOptions(): ApplicationBackupOptionsModel {
    let me = this;
    me.model.excludeLogbackup = false;
    me.model.setPerformLogbackup(me.enableLogBackup);

    return me.model;
  }

  public isValid(): boolean {
    return true;
  }
}
