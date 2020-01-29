import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class ScheduleModel {

  @JsonProperty('frequency', Number, true)
  public frequency: number = 1;

  @JsonProperty('type', String, true)
  public type: string = 'DAILY';

  public activateHour: number = 0;
  public activateMinute: number = 0;

  @JsonProperty('activateDate', Number, true)
  public activateDate: number = 0;

  public date: Date = new Date();
  public dow: number = 1;
  public dom: number = 1;

  @JsonProperty('domList', [Boolean], true)
  public domList = [
    false, true, false, false, false, false,
    false, false, false, false, false, false,
    false, false, false, false, false, false,
    false, false, false, false, false, false,
    false, false, false, false, false, false,
    false, false
  ];

  @JsonProperty('dowList', [Boolean], true)
  public dowList = [false, true, false, false, false, false, false, false];

  public getSchedule(){
    let me = this,
        date = me.date || new Date();

    return {
      frequency: Number(me.frequency),
      type: me.type,
      dowList: me.type === 'WEEKLY' ? me.dowList : undefined,
      domList: me.type === 'MONTHLY' ? me.domList : undefined,
      activateDate: date.setHours(Number(me.activateHour), Number(me.activateMinute), 0, 0)
    };
  }
}
