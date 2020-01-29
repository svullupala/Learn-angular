import {Component, ElementRef, EventEmitter, Input, DoCheck, OnDestroy, OnInit, Output, ViewChild, AfterViewInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {SiteModel, ThrottleRate} from '../site.model';
import {SiteService} from '../site.service';
import {WeeklyScheduleComponent} from 'shared/components/weekly-schedule/weekly-schedule.component';
import {WeeklyScheduleModel} from 'shared/components/weekly-schedule/weekly-schedule.model';

@Component({
  selector: 'site-edit',
  templateUrl: './siteEdit.component.html'
})

export class SiteEditComponent implements OnInit, OnDestroy, DoCheck {
  @Output() saveClick = new EventEmitter();
  @Output() cancelClick = new EventEmitter();
  @Input() disableAddSite: boolean = false;

  @ViewChild(WeeklyScheduleComponent) scheduleComponent: WeeklyScheduleComponent;

  public form: FormGroup;
  public name: AbstractControl;
  public throttle: AbstractControl;
	public enableThrottles: AbstractControl;
  model: SiteModel;
  throttleRate: ThrottleRate;
  schedule: WeeklyScheduleModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();

  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private masked: boolean = false;

  constructor(private siteService: SiteService, fb: FormBuilder,
              private translate: TranslateService) {

    this.form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
			'enableThrottles': [''],
      'throttle': ['', Validators.compose([Validators.required, Validators.min(0)])]
    });
    this.name = this.form.controls['name'];
    this.throttle = this.form.controls['throttle'];
		this.enableThrottles = this.form.controls['enableThrottles'];
  }

  ngOnDestroy() {
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
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  reset(): void {
    this.resetModel();
    this.form.reset();
  }

  ngDoCheck(): void {
		if (this.enableThrottles.value == true) {
			this.throttle.enable();
		} else {
			this.throttle.disable();
		}
	}

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'site.textCreationSuccessful',
      'site.textEditSuccessful',
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['site.textCreationSuccessful'];
        me.textEditSucceed = resource['site.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
		this.resetModel();
  }

  ngAfterViewInit(): void {
		this.resetThrottle();
	}

  onAddClick() {
    let me = this;
    if (!me.model.phantom)
      me.reset();
  }

  onCancelClick() {
    this.cancelClick.emit();
    this.reset();
  }

  onSaveClick() {
    let me = this;

    me.mask();
    me.model.setThrottleRate(me.throttleRate);
    me.model.setThrottleSchedule(me.scheduleComponent.getValue());
      if (me.model.phantom) {
        me.siteService.create(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.info(me.textCreateSucceed);
              me.saveClick.emit();
              me.reset();
            },
            err => {
              me.unmask();
              me.handleError(err, false);
            }
          );
      } else {
        me.siteService.update(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.info(me.textEditSucceed);
              me.saveClick.emit();
              me.reset();
            },
            err => {
              me.unmask();
              me.handleError(err, false);
            }
          );
      }
  }

  startEdit(item: SiteModel) {
    this.resetModel(item);
  }

  private resetModel(model?: SiteModel): void {
    let me = this;
    me.model = model || new SiteModel();
		me.resetThrottle();
  }

  private resetThrottle(): void {
    let me = this, hasThrottleRateValue = me.model.getThrottleRate().value >= 0;
    me.throttleRate = hasThrottleRateValue ? me.model.getThrottleRate() : {value: 100, unit: 'megabytes'};
    me.schedule = new WeeklyScheduleModel().fromJson(me.model.getThrottleSchedule());
    me.model.enableThrottles = hasThrottleRateValue;
  }

  private isValid(): boolean {
		return this.form.valid;
  }
}
