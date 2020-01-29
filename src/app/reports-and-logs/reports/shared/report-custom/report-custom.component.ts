import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ModalDirective } from 'ngx-bootstrap';
import { Observable } from 'rxjs/Observable';
import { AlertComponent, ErrorHandlerComponent } from 'shared/components';
import { RestService, SessionService } from 'core';
import { ReportModel } from '../report.model';
import {
  ReportParameterModel,
  ReportParameterNvPairModel,
  ReportParameterValuesModel
} from '../report-parameter.model';
import { ReportParametersModel } from '../report-parameters.model';
import { DatasetModel } from 'shared/models/dataset.model';
import { NvPairModel } from 'shared/models/nvpair.model';
import { LinkModel } from 'shared/models/link.model';
import { SharedService } from 'shared/shared.service';
import { isNumber } from 'util';
import { Subject } from 'rxjs';
import { ReportsService } from 'reports/shared/reports.service';

export interface MultipleSelectItem {
  id: number;
  itemName: string;
  ctx: {
    pair: ReportParameterNvPairModel;
    param: ReportParameterModel;
  };
}

@Component({
  selector: 'report-custom',
  styleUrls: ['./report-custom.component.scss'],
  templateUrl: './report-custom.component.html'
})
export class ReportCustomComponent implements OnInit, OnChanges, OnDestroy {
  @Input() report: ReportModel;
  @Input() createLink: LinkModel;
  @Input() isSaveCustomReport: boolean = false;
  @Input() disableAllFields: boolean = false;
  @Input() tabContentEl: HTMLElement;
  @Output() saveSuccess = new EventEmitter<ReportModel>();
  @Output() onSaveValid = new EventEmitter<boolean>();

  @ViewChild('childModal') childModal: ModalDirective;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  description: string;
  name: string;
  model: DatasetModel<ReportParameterModel>;
  public form: FormGroup;
  public reportName: AbstractControl;
  public isLoading: boolean = false;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textUpdateSucceed: string;
  private textConfirm: string;
  private textSelectParamTpl: string;
  private masked: boolean = false;
  private destroy$ = new Subject<boolean>();

  constructor(
    private rest: RestService,
    fb: FormBuilder,
    private translate: TranslateService,
    private reportsService: ReportsService
  ) {
    this.form = fb.group({
      reportName: ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.reportName = this.form.controls['reportName'];
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler) me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;

    me.translate
      .get([
        'common.infoTitle',
        'common.processingRequestMsg',
        'common.textConfirm',
        'reports.textCreateSucceed',
        'reports.textUpdateSucceed',
        'reports.textSelectParamTpl'
      ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['reports.textCreateSucceed'];
        me.textUpdateSucceed = resource['reports.textUpdateSucceed'];
        me.textSelectParamTpl = resource['reports.textSelectParamTpl'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    this.form.valueChanges
      .debounceTime(100)
      .takeUntil(this.destroy$)
      .subscribe(() => {
        this.isSaveValid();
      });
    this.reportsService
      .isCustomReportLoading$()
      .takeUntil(this.destroy$)
      .subscribe(loading => (this.isLoading = loading));
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this,
      report;
    if (changes && changes['report']) {
      report = changes['report'].currentValue;
      if (report) {
        me.reset(report);
        me.loadReport(report);
      } else {
        me.model = undefined;
        me.reset();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  /**
   * Gets custom params.
   * @returns {Array<ReportParameterModel>}
   */
  getCustomParams(): Array<ReportParameterModel> {
    let me = this,
      records = me.model ? this.model.records : undefined;
    if (records) {
      records.forEach(function(param) {
        if (isNumber(param.defaultValue)) param.value = Number(param.value);
      });
    }
    return records;
  }

  onItemSelect(item: MultipleSelectItem) {
    let me = this,
      pair = item.ctx.pair,
      param = item.ctx.param,
      idx: number,
      model: DatasetModel<ReportParameterModel> = me.model;

    if (!param.allowMultipleValues) {
      idx = (model.records || []).findIndex(record => {
        return (
          param.name === (record.dependencies && record.dependencies.length > 0 && record.dependencies[0])
        );
      });
      if (idx !== -1) {
        // Save a an extra check doing this. Avoid two ternary op.
        model.records[idx].metadata['selectedItems'] = [];
        model.records[idx].value = [];
        if (pair.value === '(All)') {
          model.records[idx].metadata['selectedItems'] = [item];
          model.records[idx].value = [pair.value];
        }
      }
    }
    if (pair.value === '(All)') {
      param.metadata['selectedItems'] = [item];
      if (param.allowMultipleValues) {
        param.value = param.value || [];
        param.value.splice(0);
        param.value.push(pair.value);
      } else {
        param.value = pair.value;
      }
    } else {
      if (param.allowMultipleValues) {
        param.value = me.getSelectedItemsPairValues(param.metadata['selectedItems']);
        for (let i = 0; i < param.metadata['selectedItems'].length; i++) {
          if (param.metadata['selectedItems'][i].ctx.pair.value === '(All)') {
            param.metadata['selectedItems'].splice(i, 1);
            break;
          }
        }
      } else {
        param.value = pair.value;
      }
    }
  }

  OnItemDeSelect(item: MultipleSelectItem) {
    let me = this,
      pair = item.ctx.pair,
      param = item.ctx.param;
    if (param.allowMultipleValues) me.removeValueFromParam(param, pair.value);
    else param.value = undefined;
  }

  private reset(report?: ReportModel): void {
    let me = this;
    me.getNameDesc(report || me.report);
    me.reportName.reset(me.name);
  }

  /**
   * Get the pair values from the selected list. This eliminates side effect when switching types.
   * (NOTE: Only for allowMultipleValues mode)
   * @param {Array MultipleSelectItem} selectedItems
   * @return {Array string} values
   */
  private getSelectedItemsPairValues(selectedItems: Array<MultipleSelectItem>): Array<string> {
    let values: Array<string> = [];
    if (selectedItems && selectedItems.length > 0) {
      selectedItems.forEach(selectedItem => {
        values.push(selectedItem.ctx.pair.value);
      });
      for (let i = 0; i < values.length; i++) {
        if (values[i] === '(All)') {
          values.splice(i, 1);
          break;
        }
      }
    }
    return values;
  }

  /**
   * Remove a value from the given param (NOTE: Only for allowMultipleValues mode)
   * @param {ReportParameterModel} param
   */
  private removeValueFromParam(param: ReportParameterModel, value: any): void {
    let me = this,
      paramValue = param.value || [],
      idx = paramValue.findIndex(function(item) {
        return item === value;
      });
    if (idx !== -1) paramValue.splice(idx, 1);
  }

  private loadReport(report: ReportModel): void {
    let me = this,
      observable: Observable<ReportModel>;
    if (report.custom) {
      // Only custom report needs to be loaded.
      observable = report.getRecord<ReportModel>(ReportModel, 'self', me.rest);
      if (observable) {
        this.reportsService.enableCustomReportLoadingStatus();
        observable.subscribe(
          record => {
            me.report = record;
            me.loadParams(me.report);
            me.reportName.disable();
          },
          err => {
            this.reportsService.disableCustomReportLoadingStatus();
            me.handleError(err, false);
          }
        );
      }
    } else {
      // For canned report, load its parameters directly.
      me.reportName.enable();
      me.loadParams(me.report);
    }
  }

  private loadParams(report: ReportModel): void {
    let me = this,
      observable = report.getDataset<ReportParameterModel, ReportParametersModel>(
        ReportParametersModel,
        'parameters',
        undefined,
        undefined,
        0,
        RestService.pageSize,
        undefined,
        me.rest
      );
    if (observable) {
      this.reportsService.enableCustomReportLoadingStatus();
      observable.subscribe(
        dataset => {
          this.reportsService.disableCustomReportLoadingStatus();
          me.model = dataset;
          me.initParams();
        },
        err => {
          this.reportsService.disableCustomReportLoadingStatus();
          me.handleError(err, false);
        }
      );
    }
  }

  private paramDefaultValue(param: ReportParameterModel): any {
    let me = this,
      isCustom = me.report ? me.report.custom : false,
      hasValues = isCustom ? !!me.report.paramValues : false;
    return isCustom && hasValues ? me.report.paramValues[param.name] : param.defaultValue;
  }

  private initParams(): void {
    let me = this,
      params = me.model ? me.model.records : [];
    params.forEach(function(param) {
      param.value = me.paramDefaultValue(param);
      me.loadParamValues(param);
    });
  }

  private loadParamValues(item: ReportParameterModel): void {
    let me = this,
      param: ReportParameterModel,
      hasDepends = item.dependencies && item.dependencies.length > 0,
      extraParams: Array<NvPairModel> = [];
    if (item.hasLink('values') && (!item.values || item.values.length < 1)) {
      if (hasDepends) {
        param = me.findParam(item.dependencies[0]);
        if (param) {
          extraParams.push(new NvPairModel('id', param.value));
        }
      }
      let observable = item.getDataset<ReportParameterNvPairModel, ReportParameterValuesModel>(
        ReportParameterValuesModel,
        'values',
        undefined,
        undefined,
        0,
        undefined,
        extraParams
      );
      if (observable) {
        observable.subscribe(
          dataset => {
            item.values = dataset.records;

            me.initParamMetadata(item);
          },
          err => me.handleError(err, false)
        );
      }
    } else if (item.values && item.values.length > 0) {
      me.initParamMetadata(item);
    }
  }

  private initParamMetadata(param: ReportParameterModel) {
    let me = this,
      hasValue = !!param.value,
      hasValues = param.values && param.values.length > 0,
      allowMultipleValues = param.allowMultipleValues,
      dropdownList = [],
      selectedItems = [],
      dropdownItem: MultipleSelectItem,
      dropdownSettings = {
        singleSelection: !allowMultipleValues,
        text: SharedService.formatString(me.textSelectParamTpl, param.promptText || param.name),
        enableSearchFilter: false,
        enableCheckAll: false
      };
    if (hasValues) {
      param.values.forEach(function(item: ReportParameterNvPairModel, index) {
        dropdownItem = { id: index, itemName: item.name, ctx: { pair: item, param: param } };
        dropdownList.push(dropdownItem);
        if (hasValue) {
          if (
            (allowMultipleValues && param.value.indexOf(item.value) !== -1) ||
            (!allowMultipleValues && param.value === item.value)
          )
            selectedItems.push(dropdownItem);
        }
      });
    } else if (hasValue) {
      (allowMultipleValues ? param.value : [param.value]).forEach(function(value: any, index) {
        dropdownItem = {
          id: index,
          itemName: value,
          ctx: { pair: new ReportParameterNvPairModel(value, value), param: param }
        };
        dropdownList.push(dropdownItem);
        selectedItems.push(dropdownItem);
      });
    }

    param.metadata['dropdownList'] = dropdownList;
    param.metadata['selectedItems'] = selectedItems;
    param.metadata['dropdownSettings'] = dropdownSettings;
  }

  private findParam(name: string): ReportParameterModel {
    let me = this,
      result: ReportParameterModel;
    if (me.model && me.model.records) {
      result = me.model.records.find(function(param) {
        return param.name === name;
      });
    }
    return result;
  }

  private onParamClick(item: ReportParameterModel): void {
    let me = this,
      param: ReportParameterModel,
      hasDepends = item.dependencies && item.dependencies.length > 0,
      extraParams: Array<NvPairModel>;
    if (item.hasLink('values') && (!item.values || item.values.length < 1 || hasDepends)) {
      if (hasDepends) {
        param = me.findParam(item.dependencies[0]);
        if (param) {
          extraParams = [];
          extraParams.push(new NvPairModel('id', param.value));
        }
      }
      let observable = item.getDataset<ReportParameterNvPairModel, ReportParameterValuesModel>(
        ReportParameterValuesModel,
        'values',
        undefined,
        undefined,
        0,
        undefined,
        extraParams
      );
      if (observable) {
        observable.subscribe(
          dataset => {
            item.values = dataset.records;
            me.initParamMetadata(item);
          },
          err => me.handleError(err, false)
        );
      }
    }
  }

  private setNameDesc(report: ReportModel): void {
    let me = this;
    report.name = me.name;
    report.description = me.description;
  }

  private getNameDesc(report: ReportModel): void {
    let me = this;
    me.name = report && report.custom ? report.name : '';
    me.description = report && report.custom ? report.description : '';
  }

  public onSaveClick(scheduleData?: { trigger: any; notification: any }): void {
    let me = this,
      report: ReportModel,
      observable: Observable<ReportModel>;
    this.reportName.enable();
    if (me.form.valid && me.report) {
      if (me.report.custom && me.report.isUpdateAllowed()) {
        // Update custom report.
        this.reportsService.enableLoadingStatus();
        me.report.parameters = me.getCustomParams();
        me.setNameDesc(me.report);
        observable = me.report.update(ReportModel, me.rest);
        if (observable) {
          observable.subscribe(
            record => {
              if (scheduleData) {
                record.setTrigger = scheduleData.trigger;
                record.notification = scheduleData.notification;
              }
              this.reportsService.customReportSavedSuccessfully.next({
                item: record,
                options: { removeSchedule: scheduleData && !Object.keys(scheduleData.trigger).length }
              });
              me.info(SharedService.formatString(me.textUpdateSucceed, record.name), me.infoTitle);
              me.reset();
              me.saveSuccess.emit(record);
            },
            err => {
              this.reportsService.disableLoadingStatus();
              me.handleError(err, false);
            },
          );
        }
      } else if (!me.report.custom && me.createLink) {
        // Create custom report.
        this.reportsService.enableLoadingStatus();
        report = new ReportModel();
        report.custom = true;
        report.parentId = me.report.id;
        report.parameters = me.getCustomParams();
        me.setNameDesc(report);
        observable = DatasetModel.create<ReportModel>(ReportModel, report, me.createLink, me.rest);
        if (observable) {
          observable.subscribe(
            record => {
              if (scheduleData) {
                record.setTrigger = scheduleData.trigger;
                record.notification = scheduleData.notification;
              }
              this.reportsService.customReportSavedSuccessfully.next({ item: record, options: {} });
              me.info(SharedService.formatString(me.textCreateSucceed, record.name), me.infoTitle);
              me.reset();
              me.saveSuccess.emit(record);
            },
            err => {
              this.reportsService.disableLoadingStatus();
              me.handleError(err, false);
            },
            () => {
              this.reportsService.disableLoadingStatus();
            }
          );
        }
      }
    }
  }

  private isSaveValid(): boolean {
    let formValid = this.form.valid,
      createLinkInput = !!this.createLink,
      report = this.report;

    if (this.report.custom) {
      formValid = this.form.getRawValue();
    }

    // Note: the backend returns the "run" action link correctly based on the existence of the "create" permission
    // of the role that user assumes. UI needs to examine the "run" action link for the selected report to determine
    // if we need to disable the run button. for the create custom report case, use similar logic to enable/disable
    // the save button because the backend does not return the "create" action link for each report entry.

    const isValid =
      formValid &&
      report &&
      ((report.custom && report.isUpdateAllowed()) ||
        (!report.custom && report.hasLink('run') && createLinkInput));

    this.onSaveValid.emit(isValid);
    return isValid;
  }

  private isUpdate(): boolean {
    let report = this.report;
    return report && report.custom;
  }

  private getDropdownSettings(params: any): any {
    return {
      ...params,
      disabled: this.disableAllFields
    };
  }
}
