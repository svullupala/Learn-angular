import {JsonObject, JsonProperty} from 'json2typescript';
import {HasPersistentJson, HasProxy, RestService} from 'core';

@JsonObject
export class LogbackupRpoModel implements HasPersistentJson {
  @JsonProperty('frequency', Number, true)
  public frequency: number = 1;

  @JsonProperty('frequencyType', String, true)
  public frequencyType: string = 'DAY';

  @JsonProperty('triggerTime', String, true)
  public triggerTime: string = '';

  @JsonProperty('metadata', Object, true)
  public metadata: object = undefined;

  public activateDate: number;

  public get metadataActivateDate(): number {
    return this.metadata && this.metadata['activateDate'];
  }

  public getPersistentJson(): object {
    return {
      frequency: this.frequency,
      frequencyType: this.frequencyType,
      triggerTime: this.triggerTime || '',
      metadata: {
        activateDate: this.activateDate
      }
    };
  }
}

@JsonObject
export class LogbackupOptionsModel implements HasPersistentJson {
  @JsonProperty('performlogbackup', Boolean, true)
  public performlogbackup: boolean = false;

  @JsonProperty('purgePrimaryLogs', Boolean, true)
  public purgePrimaryLogs: boolean = false;

  @JsonProperty('primaryLogRetentionDays', Number, true)
  public primaryLogRetentionDays: number = 3;

  @JsonProperty('rpo', LogbackupRpoModel, true)
  public rpo: LogbackupRpoModel = new LogbackupRpoModel();

  public getPersistentJson(): object {
    return {
      purgePrimaryLogs: this.purgePrimaryLogs,
      primaryLogRetentionDays: this.primaryLogRetentionDays,
      performlogbackup: this.performlogbackup,
      rpo: this.performlogbackup ? this.rpo.getPersistentJson() : {}
    };
  }
}

@JsonObject
export class ApplicationBackupOptionModel implements HasPersistentJson {

  @JsonProperty('maxParallelStreams', Number, true)
  public maxParallelStreams: number = 1;

  @JsonProperty('dbFilesForParallelStreams', String, true)
  public dbFilesForParallelStreams: string = 'SINGLE_FILE';

  @JsonProperty('logbackup', LogbackupOptionsModel, true)
  public logbackup: LogbackupOptionsModel = new LogbackupOptionsModel();

  @JsonProperty('backupPreferredNode', String, true)
  public backupPreferredNode: string = '';

  public excludeLogbackup: boolean = true;

  public get performLogbackup(): boolean {
    return this.logbackup && this.logbackup.performlogbackup;
  }

  public getPersistentJson(): object {
    let returnVal: object = {
      maxParallelStreams: this.maxParallelStreams,
      dbFilesForParallelStreams: this.dbFilesForParallelStreams,
      backupPreferredNode: this.backupPreferredNode
    };
    if (!this.excludeLogbackup) {
      returnVal['logbackup'] = this.performLogbackup ? this.logbackup.getPersistentJson() : {};
    }
    return returnVal;
  }
}

@JsonObject
export class ApplicationBackupOptionsModel implements HasProxy, HasPersistentJson {

  public proxy: RestService;

  @JsonProperty('options', ApplicationBackupOptionModel, true)
  public options: ApplicationBackupOptionModel = new ApplicationBackupOptionModel();

  public get purgePrimaryLogs(): boolean {
    return this.logbackup && this.logbackup.purgePrimaryLogs;
  }

  public set purgePrimaryLogs(value: boolean) {
    if (this.logbackup)
      this.logbackup.purgePrimaryLogs = value;
  }

  public get primaryLogRetentionDays(): number {
    return this.logbackup && this.logbackup.primaryLogRetentionDays;
  }

  public set primaryLogRetentionDays(value: number) {
    if (this.logbackup)
      this.logbackup.primaryLogRetentionDays = value;
  }

  public get maxParallelStreams(): number {
    return this.options && this.options.maxParallelStreams;
  }

  public set maxParallelStreams(maxParallelStreams: number) {
    if (this.options) {
      this.options.maxParallelStreams = maxParallelStreams;
    }
  }

  public get backupPreferredNode(): string {
    return this.options && this.options.backupPreferredNode;
  }

  public set backupPreferredNode(backupPreferredNode: string) {
    if (this.options) {
      this.options.backupPreferredNode = backupPreferredNode;
    }
  }

  public get dbFilesForParallelStreams(): string {
    return this.options && this.options.dbFilesForParallelStreams;
  }

  public set dbFilesForParallelStreams(dbFilesForParallelStreams: string) {
    if (this.options) {
      this.options.dbFilesForParallelStreams = dbFilesForParallelStreams;
    }
  }

  public get logbackup(): LogbackupOptionsModel {
    return this.options && this.options.logbackup;
  }

  public get isLogbackupEnabled(): boolean {
    if (this.logbackup) {
      return this.logbackup.performlogbackup;
    }
    return false;
  }

  public get rpo(): LogbackupRpoModel {
    return this.logbackup && this.logbackup.rpo;
  }

  public get frequency(): number {
    return this.rpo && this.rpo.frequency;
  }

  public setFrequency(frequency: number): void {
    if (this.rpo) {
      this.rpo.frequency = frequency;
    }
  }

  public get frequencyType(): string {
    return this.rpo && this.rpo.frequencyType;
  }

  public get scheduleFrequencyType(): string {
    return this.convertScheduleFrequencyType(this.rpo && this.rpo.frequencyType);
  }

  public setFrequencyType(frequencyType: string): void {
    if (this.rpo) {
      this.rpo.frequencyType = this.convertFrequencyType(frequencyType);
    }
  }

  public get triggerTime(): string {
    return this.rpo && this.rpo.triggerTime;
  }

  public setTriggerTime(activateDate: number): void {
    if (this.rpo) {
      this.rpo.triggerTime = new Date(activateDate).toLocaleTimeString('en-US');
    }
  }

  public setPerformLogbackup(performLogbackup: boolean): void {
    if (this.logbackup) {
      this.logbackup.performlogbackup = performLogbackup;
    }
  }

  public set excludeLogbackup(exclude: boolean) {
    if (this.options) {
      this.options.excludeLogbackup = exclude;
    }
  }

  public get activateDate(): number {
    return this.rpo && this.rpo.metadataActivateDate;
  }

  public getPersistentJson(): object {
    return this.options.getPersistentJson();
  }
  /**
   * Checks if there are any properties on the options.
   * @return {Boolean} true if there no properties on the object.
   */
  isEmpty(): boolean {
    let me = this, object = this.options || {};
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }

  private convertFrequencyType(type: string): string {
    switch (type) {
      case 'SUBHOURLY':
        return 'MINUTE';
      case 'HOURLY':
        return 'HOUR';
      case 'DAILY':
        return 'DAY';
      case 'WEEKLY':
        return 'WEEK';
      case 'MONTHLY':
        return 'MONTH';
      default:
        return '';
    }
  }

  private convertScheduleFrequencyType(type: string): string {
    switch (type) {
      case 'MINUTE':
        return 'SUBHOURLY';
      case 'HOUR':
        return 'HOURLY';
      case 'DAY':
        return 'DAILY';
      case 'WEEK':
        return 'WEEKLY';
      case 'MONTH':
        return 'MONTHLY';
      default:
        return '';
    }
  }
}
