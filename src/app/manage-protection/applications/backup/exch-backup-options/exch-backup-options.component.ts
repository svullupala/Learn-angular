import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';
import {DefineSchedule} from 'shared/components/define-schedule/define-schedule.component';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';
import {ApplicationBackupOptionsPage} from
  'applications/backup/application-backup-options/application-backup-options-page';
import {ApplicationBackupService} from 'applications/backup/application-backup.service';
import {AppServerVmModel, AppServerVmsModel} from 'applications/shared/appservervms.model';
import {JsonConvert} from 'json2typescript/index';

@Component({
  selector: 'exch-backup-options',
  templateUrl: 'exch-backup-options.component.html'
})

export class ExchBackupOptionsComponent extends
  ApplicationBackupOptionsPage<ApplicationBackupOptionsModel> implements OnInit {
  @Input() model: ApplicationBackupOptionsModel;
  @ViewChild(DefineSchedule) defineScheduleComponent: DefineSchedule;

  private enableLogBackup: boolean = false;
  private logBackupValid: boolean = false;
  private purgePrimaryLogs: boolean = false;
  private view: string = '';
  private selectionSet: Array<BaseApplicationModel>;
  private appServerVms: Array<AppServerVmModel> = [];

  constructor(private backupService: ApplicationBackupService) {
    super();
  }

  ngOnInit() {
    let me = this;
    if (!me.model)
    me.model = new ApplicationBackupOptionsModel();
  }

  resetLogBackupValid(selections: Array<BaseApplicationModel>): void {
    this.setLogBackupValid(this.isLogBackupValid(selections));
  }

  setSelections(selections: Array<BaseApplicationModel>): void {
    let me = this;
    this.selectionSet = selections;
    if (me.showNodeSelection()) {
      me.backupService.getAppServerVms(me.selectionSet[0].getUrl('appServerVms'))
        .subscribe(
          dataset => {
            let appservers = JsonConvert.deserializeObject(dataset, AppServerVmsModel);
            me.appServerVms = appservers.appservervms;
          }
        );
    }
    else {
      me.appServerVms = [];
    }
  }

  setView(view: string){
    this.view = view;
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

  private showNodeSelection(): boolean {
    let me = this;
    return me.selectionSet && me.selectionSet.length > 0
      && me.selectionSet[0].resourceType === 'database' && me.view === 'databasegroupview';
  }

  private isLogBackupValid(selections: Array<BaseApplicationModel>): boolean {
    let me = this, result = false;
    if (selections.length > 0 && selections[0].resourceType === 'applicationinstance')
      result = true;
    else {
      result = selections.findIndex(function (item) {
        if (item.isLogBackupEligible())
          return true;
      }) !== -1;
    }
    return result;
  }

  private setLogBackupValid(disableLogBackup?: boolean) {
    this.logBackupValid = disableLogBackup || false;
  }

  private setLogbackUpValue() {
    let schVal: object = this.defineScheduleComponent && this.defineScheduleComponent.getSchedule();

    this.model.setPerformLogbackup(this.enableLogBackup);
    this.model.rpo.activateDate = schVal['activateDate'];
    this.model.setFrequency(schVal['frequency']);
    this.model.setFrequencyType(schVal['type']);
    this.model.setTriggerTime(schVal['activateDate']);
  }
}
