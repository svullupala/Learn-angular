import {
  ViewChild, Component, EventEmitter, Input, Output, OnInit, OnChanges,
} from '@angular/core';
import { ModalDirective, Trigger } from 'ngx-bootstrap';
import { DefineEditScheduleModel } from '../define-edit-schedule.model';
import {DefineSchedule} from 'shared/components/define-schedule/define-schedule.component';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';
import {JsonConvert} from 'json2typescript';
import { TriggerService } from 'shared/components/define-edit-schedule/trigger.service';

@Component({
  selector: 'define-edit-schedule-modal',
  templateUrl: './define-edit-schedule-modal.component.html',
  styleUrls: ['./define-edit-schedule-modal.component.scss']
})
export class DefineEditScheduleModalComponent implements OnInit, OnChanges {
  @ViewChild('defineEditScheduleModal') defineEditScheduleModal: ModalDirective;
  @ViewChild(DefineSchedule) triggerComponent: DefineSchedule;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @Output('save') saveEvent = new EventEmitter<DefineEditScheduleModel>();

  @Input() jobName: string;
  @Input() triggerId: string;

  public mask: boolean = false;

  constructor(
    private triggerService: TriggerService) {
}

  ngOnInit() {
  }

  ngOnChanges(): void {
  }

  public show(jobTrigger): void {
    this.setSchedule(jobTrigger);
    this.defineEditScheduleModal.show();
    this.showEvent.emit();
  }

  public hide(): void {
    this.defineEditScheduleModal.hide();
    this.hideEvent.emit();
  }

  public showMask(): void {
    this.mask = true;
  }

  public hideMask(): void {
    this.mask = false;
  }

  public getSchedule() {
    return this.triggerComponent && this.triggerComponent.getSchedule();
  }

  public resetSchedule(): void {
    this.triggerComponent.resetSchedule();
  }

  public setSchedule(trigger: Object): void {
    this.triggerComponent.model = JsonConvert.deserializeObject(trigger, ScheduleModel);
    this.triggerComponent.parseDate();
  }

  private save(): void {
    let me = this, observable = this.triggerService.updateTrigger(this.triggerId, this.putBody(this.getSchedule()));

    observable.subscribe(
      dataset => {
        this.defineEditScheduleModal.hide();
        this.saveEvent.emit();
      },
      err => {}
    );
  }

  private putBody(updatedTrigger: any): Object {
    let putPostBody = {
      'properties' : {
        'frequency' : updatedTrigger.frequency,
        'type' : updatedTrigger.type,
        'activateDate' : updatedTrigger.activateDate,
        'deactivateDate' : null
      }
    };

    if (updatedTrigger.type === 'MONTHLY') {
      putPostBody.properties['domList'] = updatedTrigger.domList;
    }

    if (updatedTrigger.type === 'WEEKLY') {
      putPostBody.properties['dowList'] = updatedTrigger.dowList;
    }

    return putPostBody;
  }
}
