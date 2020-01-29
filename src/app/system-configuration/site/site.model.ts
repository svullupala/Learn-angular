import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {WeeklyScheduleEntryPlain} from 'shared/components/weekly-schedule/weekly-schedule.model';

export type ThrottleUnit = 'bytes' | 'kilobytes' | 'megabytes' | 'gigabytes';
export type SiteThrottle = {
  rate?: string;
  schedules?: WeeklyScheduleEntryPlain[];
};

export type ThrottleRate = {
  value?: number;
  unit: ThrottleUnit;
};

@JsonObject
export class SiteModel extends BaseModel {

  @JsonProperty('name', String)
  public hostAddress: string = undefined;

  @JsonProperty('id', String)
  public id: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('defaultSite', Boolean, true)
  public defaultSite: boolean = false;

  @JsonProperty('throttles', [Object], true)
  public throttles: SiteThrottle[] = [];

  @JsonProperty('demo', Boolean, true)
  public demo: boolean = false;

	public enableThrottles: boolean = false;

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
		return {
			name: this.name,
			description: this.description,
			defaultSite: this.defaultSite,
			throttles: (this.enableThrottles) ? this.throttles : []
		};
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return {
      name: this.name,
      description: this.description,
      defaultSite: this.defaultSite,
      throttles: (this.enableThrottles) ? this.throttles : []
    };
  }

  public setThrottleRate(rate: ThrottleRate): void {
    this.throttles = this.throttles || [];
    this.throttles[0] = this.throttles[0] || {};
    this.throttles[0].rate = String(rate.value * this.throttleUnitValue(rate.unit));
  }

  public getThrottleRate(): ThrottleRate {
    let value, size, unit: ThrottleUnit = 'megabytes', result: ThrottleRate,
      throttle = this.throttles && this.throttles.length > 0 ? this.throttles[0] : null;

    if (throttle) {
      value = Number(throttle.rate);
      if (value < 1024) {
        size = value;
        unit = 'bytes';
      } else if (value < 1048576) {
        size = Math.round((value * 10) / 1024) / 10;
        unit = 'kilobytes';
      } else if (value < 1073741824) {
        size = Math.round((value * 10) / 1048576) / 10;
        unit = 'megabytes';
      } else if (value < 1099511627776) {
        size = Math.round((value * 10 ) / 1073741824) / 10;
        unit = 'gigabytes';
      }
    }
    result = {value: size, unit: unit};
    return result;
  }

  public setThrottleSchedule(schedule: WeeklyScheduleEntryPlain[]): void {
    this.throttles = this.throttles || [];
    this.throttles[0] = this.throttles[0] || {};
    this.throttles[0].schedules = schedule;
  }

  public getThrottleSchedule(): WeeklyScheduleEntryPlain[] {
    let throttle = this.throttles && this.throttles.length > 0 ? this.throttles[0] : null;
    return throttle ? throttle.schedules : [];
  }

  private throttleUnitValue(unit: ThrottleUnit): number {
    let result = 0;
    switch (unit) {
      case 'bytes':
        result = 1;
        break;
      case 'kilobytes':
        result = 1024;
        break;
      case 'megabytes':
        result = 1024 * 1024;
        break;
      case 'gigabytes':
        result = 1024 * 1024 * 1024;
        break;
      default:
        break;
    }
    return result;
  }
}
