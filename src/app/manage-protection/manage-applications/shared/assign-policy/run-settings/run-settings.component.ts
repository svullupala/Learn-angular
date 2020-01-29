import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';
import { JsonConvert } from 'json2typescript/index';
import { ScrollTabEntry, ScrollTabsetComponent } from 'shared/components/sroll-tabset';
import { VadpProxyMonitorService } from 'vadp/vadp-proxy-monitor.service';
import { RestService, SessionService } from 'core';
import { BaseApplicationModel } from 'applications/shared/base-application-model.model';
import { ApplicationBackupOptionsModel } from 'applications/shared/application-backup-options.model';
import { ApplicationBackupOptionsRegistry } from 'applications/backup/application-backup-options/application-backup-options-registry';
import { ApplicationBackupOptionsService } from 'applications/backup/application-backup-options/application-backup-options.service';
import { ScheduleModel } from 'shared/components/define-schedule/schedule.model';
import { DefineSchedule, ErrorHandlerComponent } from 'shared/components';
import { ApplicationsRunSettingsDynamicOptions } from './run-settings.model';
import { AppServerVmModel, AppServerVmsModel } from 'applications/shared/appservervms.model';
import { ApplicationBackupService } from 'applications/backup/application-backup.service';
import { NvPairModel } from 'shared/models/nvpair.model';

@Component({
  selector: 'applications-assign-policy-run-settings',
  templateUrl: './run-settings.component.html',
  styleUrls: ['./run-settings.component.scss'],
  providers: [VadpProxyMonitorService]
})
export class RunSettingsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() assignPolicyTo: BaseApplicationModel;
  @Input() model: ApplicationBackupOptionsModel = new ApplicationBackupOptionsModel();
  @Input() isActive: boolean = false;
  @Input() applicationType: string;
  @Input() view: NvPairModel;
  @Input() editMode: boolean = false;

  @ViewChild('tabLogBackup', { read: TemplateRef }) tabLogBackup: TemplateRef<any>;
  @ViewChild('tabParallelStreams', { read: TemplateRef }) tabParallelStreams: TemplateRef<any>;
  @ViewChild(ScrollTabsetComponent) scrollTabsetComponent: ScrollTabsetComponent;
  @ViewChild(DefineSchedule) defineScheduleComponent: DefineSchedule;

  scrollTabs: ScrollTabEntry[] = [];
  dynamicOptions: ApplicationsRunSettingsDynamicOptions;
  mask: boolean = false;
  optionsLoaded: boolean = false;
  enableLogBackup: boolean = false;
  purgePrimaryLogs: boolean = false;
  private logBackupValid: boolean = false;
  private options: ApplicationBackupOptionsModel;
  private optionsRegistry: ApplicationBackupOptionsRegistry;
  private appServerVms: Array<AppServerVmModel> = [];
  private errorHandler: ErrorHandlerComponent;
  private tabTranslations: { [key: string]: string };
  private textCustomizeHowJobsWillRun: string;

  constructor(
    private translateService: TranslateService,
    private optionsService: ApplicationBackupOptionsService,
    private restService: RestService,
    private backupService: ApplicationBackupService
  ) {
    this.dynamicOptions = new ApplicationsRunSettingsDynamicOptions();
  }

  ngOnInit(): void {
    this.setTranslations();
    this.setDynamicOptionsConfig();

    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.optionsRegistry = this.optionsService.getRegistry(this.applicationType);
    this.options = new this.optionsRegistry.modelClazz();
    this.setOptions(this.options);

    if (this.dynamicOptions.backupPreferredNode) {
      this.loadAppServerVms();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['isActive'] && changes['isActive'].currentValue) {
      setTimeout(() => {
        this.onActivate();
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollTabs = this.prepareTabs();
      this.loadOptions();
    });
  }

  get formattedInfoText(): string {
    return SharedService.formatString(this.textCustomizeHowJobsWillRun, this.assignPolicyTo.name);
  }

  enableEditMode(): void {
    this.editMode = true;
  }

  disableEditMode(): void {
    this.editMode = false;
  }

  onCancel(): void {
    this.disableEditMode();
  }

  onSave(): void {
    this.saveOptions();
  }

  isValid(): boolean {
    return this.enableLogBackup
      ? this.defineScheduleComponent && this.defineScheduleComponent.isValid()
      : true;
  }

  isEnableLogBackupDisabled(): boolean {
    return this.applicationType === 'exch' && !this.logBackupValid;
  }

  private setTranslations(): void {
    this.translateService
      .get([
        'inventory.textCustomizeHowJobsWillRun',
        'inventory.textLogBackup',
        'inventory.textParallelStreams'
      ])
      .subscribe(trans => {
        this.textCustomizeHowJobsWillRun = trans['inventory.textCustomizeHowJobsWillRun'];
        this.tabTranslations = {
          textLogBackup: trans['inventory.textLogBackup'],
          textParallelStreams: trans['inventory.textParallelStreams']
        };
      });
  }

  private prepareTabs(): ScrollTabEntry[] {
    const tabs: ScrollTabEntry[] = [];

    if (this.dynamicOptions.logBackup) {
      tabs.push({
        key: 'tabLogBackup',
        title: this.tabTranslations.textLogBackup,
        active: true,
        content: this.tabLogBackup
      });
    }

    tabs.push({
      key: 'tabParallelStreams',
      title: this.tabTranslations.textParallelStreams,
      content: this.tabParallelStreams
    });

    return tabs;
  }

  private setDynamicOptionsConfig(): void {
    this.dynamicOptions = new ApplicationsRunSettingsDynamicOptions({
      logBackup: this.applicationType !== 'mongo',
      parallelStreamRadio: this.applicationType === 'sql',
      truncateSourceLogs: this.applicationType === 'oracle',
      primaryLogRetention: this.applicationType === 'oracle',
      backupPreferredNode:
        this.assignPolicyTo.resourceType === 'database' &&
        this.view &&
        this.view.value === 'databasegroupview'
    });
  }

  private onActivate(): void {
    if (this.scrollTabsetComponent) {
      this.scrollTabsetComponent.refreshTabs();
    }
  }

  private loadAppServerVms(): void {
    this.backupService.getAppServerVms(this.assignPolicyTo.getUrl('appServerVms')).subscribe(dataset => {
      this.appServerVms = JsonConvert.deserializeObject(dataset, AppServerVmsModel).appservervms;
    });
  }

  private setOptions(options?: ApplicationBackupOptionsModel): void {
    if (options === undefined || options.isEmpty()) {
      this.enableLogBackup = false;
      this.purgePrimaryLogs = false;
      this.logBackupValid = false;
      if (this.defineScheduleComponent) {
        this.defineScheduleComponent.resetSchedule();
      }
      this.model = new ApplicationBackupOptionsModel();
    } else {
      this.model = options;
      this.enableLogBackup = options.isLogbackupEnabled;
      this.purgePrimaryLogs = options.purgePrimaryLogs;
      this.logBackupValid = false;

      if (this.applicationType === 'exch') {
        this.logBackupValid = this.isLogBackupValid();
      }

      if (this.enableLogBackup) {
        const scheduleModel = new ScheduleModel();
        scheduleModel.activateDate = options.activateDate;
        scheduleModel.frequency = options.frequency;
        scheduleModel.type = options.scheduleFrequencyType;

        if (this.defineScheduleComponent) {
          this.defineScheduleComponent.setModel(scheduleModel);
          this.defineScheduleComponent.parseDate();
        }
      }
    }
  }

  private getOptions(): ApplicationBackupOptionsModel {
    this.model.excludeLogbackup = false;
    this.setLogbackUpValue();

    if (this.applicationType === 'mongo' || this.applicationType === 'db2') {
      this.model.setPerformLogbackup(this.enableLogBackup);
    }

    return this.model;
  }

  private loadOptions(): void {
    this.mask = true;
    this.assignPolicyTo
      .getRecord<ApplicationBackupOptionsModel>(ApplicationBackupOptionsModel, 'options', this.restService)
      .subscribe(
        records => {
          this.optionsLoaded = true;
          this.mask = false;
          this.setOptions(records);
        },
        err => this.errorHandler.handle(err, false)
      );
  }

  private saveOptions(): void {
    const options = this.getOptions().getPersistentJson();
    this.mask = true;
    this.backupService.applyOptions([this.assignPolicyTo], options, this.applicationType).subscribe(
      () => {
        this.disableEditMode();
        this.mask = false;
      },
      err => {
        this.errorHandler.handle(err, true);
        this.mask = false;
      }
    );
  }

  private isLogBackupValid(): boolean {
    return (
      this.assignPolicyTo.resourceType === 'applicationinstance' || this.assignPolicyTo.isLogBackupEligible()
    );
  }

  private setLogbackUpValue(): void {
    let schVal: object = this.defineScheduleComponent && this.defineScheduleComponent.getSchedule();

    this.model.setPerformLogbackup(this.enableLogBackup);
    this.model.purgePrimaryLogs = this.purgePrimaryLogs;

    this.model.rpo.activateDate = schVal['activateDate'];
    this.model.setFrequency(schVal['frequency']);
    this.model.setFrequencyType(schVal['type']);
    this.model.setTriggerTime(schVal['activateDate']);
  }
}
