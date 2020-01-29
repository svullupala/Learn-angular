import {Component, Input, OnInit, OnChanges, SimpleChanges, Renderer2, NgZone} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationRestoreItem } from '../application-list-table/application-list-table.component';
import { ApplicationSubOptionModel } from 'applications/shared/application-sub-option.model';
import { ApplicationRestoreService } from 'applications/restore/application-restore.service';
import {KeyboardDate} from 'shared/util/keyboard-date';
import {FocusMonitor} from '@angular/cdk/a11y';

@Component({
  selector: 'application-pit-component',
  templateUrl: './application-pit.component.html',
  styleUrls: ['./application-pit.component.scss']
})
export class ApplicationPitComponent extends KeyboardDate implements OnChanges {
  @Input() applicationOptions: ApplicationSubOptionModel;
  @Input() restoreItems: Array<ApplicationRestoreItem>;
  @Input() workflowType: string;
  @Input() granularMode: boolean = false;
  @Input() view: string = '';
  @Input() hideByIdOption: boolean = false;
  @Input() applicationType: string;
  @Input() disabled: boolean = false;
  @Input() disablePitOnly: boolean = false;
  @Input() enablePitOnly: boolean = false;
  private IA_TYPE: string = ApplicationRestoreService.IA_VAL;
  private byTime: boolean = true;
  private selectedDate: Date;
  private selectedHr: number = 0;
  private selectedMin: number = 0;
  private selectedSeconds: number = 0;
  private epochTime: number;
  private transactionId: string;
  private bsConfig: any;
  private isNotEligible: boolean = false;
  private disablePit: boolean = true;
  private isPitEligible: boolean = false;
  private hourArray: any[] = this.createOptionsArray(24);
  private timeArray: any[] = this.createOptionsArray(60);

  constructor(protected renderer: Renderer2,
              protected focusMonitor: FocusMonitor,
              protected ngZone: NgZone,
              private translate: TranslateService) {
    super(renderer, focusMonitor, ngZone);
    this.bsConfig = Object.assign({}, {
      containerClass: 'theme-dark-blue',
      showWeekNumbers: false,
      rangeInputFormat: 'L'
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.applicationOptions = this.applicationOptions || new ApplicationSubOptionModel();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['workflowType'] && changes['workflowType'].currentValue === this.IA_TYPE) {
      this.applicationOptions.recoveryType = 'recovery';
    }
    if (changes && changes['restoreItems'] && changes['restoreItems'].currentValue) {
      this.isNotEligible =  this.checkForEligiblity(changes['restoreItems'].currentValue);
      if (this.isNotEligible) {
        this.applicationOptions.recoveryType = 'recovery';
      }
    }
    if (changes && changes['disablePitOnly'] && changes['disablePitOnly'].currentValue) {
      this.isPitEligible = false;
      this.disablePit = true;
      this.applicationOptions.recoveryType = 'recovery';
      this.isNotEligible = true;
      return;
    } else if (changes && changes['disablePitOnly'] && !changes['disablePitOnly'].currentValue) {
      this.isNotEligible =  this.checkForEligiblity(this.restoreItems);
      if (this.isNotEligible) {
        this.applicationOptions.recoveryType = 'recovery';
      }
    }
    this.isPitEligible = this.canDoPit();
    if (this.isPitEligible && this.enablePitOnly) {
      this.applicationOptions.recoveryType = 'pitrecovery';
    }
    this.disablePit = this.hidePit() || this.disablePitOnly;
  }

  public getValue(): number | string {
    if (this.canDoPit()) {
      return this.byTime ? this.epochTime : this.transactionId;
    }
    return undefined;
  }

  public getEpochTime(): number {
    return this.epochTime && this.epochTime;
  }

  public transId(): string {
    return this.transactionId && this.transactionId;
  }

  public getOptionsModel(): ApplicationSubOptionModel {
    return this.applicationOptions;
  }

  public reset(): void {
    this.transactionId = undefined;
    this.epochTime = undefined;
    this.byTime = true;
    this.isPitEligible = false;
    this.selectedDate = undefined;
    this.selectedHr = 0;
    this.selectedMin = 0;
    this.selectedSeconds = 0;
  }

  public setPit(restoreItem: ApplicationRestoreItem): void {
    if (restoreItem) {
      if (restoreItem.pointInTime && restoreItem.pointInTime > 0) {
        this.byTime = true;
        this.selectedDate = new Date(restoreItem.pointInTime);
        this.selectedHr = this.selectedDate.getHours();
        this.selectedMin = this.selectedDate.getMinutes();
        this.selectedSeconds = this.selectedDate.getSeconds();
        this.epochTime = restoreItem.pointInTime;
      } else if (restoreItem.transactionId) {
        this.byTime = false;
        this.transactionId = restoreItem.transactionId;
      }
    }
  }

  private setDate(date: Date): void {
    let pit: Date;
    this.selectedDate = date;

    if (this.selectedDate && this.selectedDate instanceof Date) {
      pit = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(),
        this.selectedHr, this.selectedMin, this.selectedSeconds);
      this.epochTime = pit.getTime();
    }
  }

  private setTime(): void {
    let pit: Date;

    if (this.selectedDate) {
      pit = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(),
        this.selectedHr, this.selectedMin, this.selectedSeconds);
      this.epochTime = pit.getTime();
    } else {
      this.selectedDate = new Date();
      pit = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(),
        this.selectedHr, this.selectedMin, this.selectedSeconds);
      this.epochTime = pit.getTime();
    }
  }

  private createOptionsArray(size: Number): any[] {
    let resultArray: any[] = [];
    for (let i = 0; i < size; i++) {
      resultArray.push({
        'displayString': this.createDisplayString(i),
        'value': i
      });
    }
    return resultArray;
  }

  private createDisplayString(value: Number): string {
    return value < 10 ? ('0' + value) : ('' + value);
  }

  private isValid(): boolean {
    return this.byTime ? (this.epochTime !== undefined) : (this.transactionId !== undefined);
  }

  private isOracle(): boolean {
    return this.applicationType && this.applicationType === 'oracle';
  }

  private isDb2(): boolean {
    return this.applicationType && this.applicationType === 'db2';
  }

  private isExchange(): boolean {
    return this.applicationType && this.applicationType === 'exch';
  }

  private isMongo(): boolean {
    return this.applicationType && this.applicationType === 'mongo';
  }

  private isSql(): boolean {
    return this.applicationType && this.applicationType === 'sql';
  }

  private determinePit(): void {
    this.isPitEligible = this.canDoPit();
  }

  private canDoPit(): boolean {
    return this.applicationOptions.recoveryType === 'pitrecovery'
      && this.workflowType !== this.IA_TYPE && this.isNotEligible === false;
  }

  private checkForEligiblity(restoreItems: Array<ApplicationRestoreItem>): boolean {
    return (restoreItems || []).findIndex((item: ApplicationRestoreItem) => {
      return (item.resource.isLogBackupEligible() !== true || item.version !== undefined);
    }) !== -1;
  }

  private hidePit(): boolean {
    return this.isNotEligible || this.workflowType === this.IA_TYPE;
  }
}
