import { JsonObject, JsonProperty } from "json2typescript";

@JsonObject
export class PreferencesCategoryModel {

  @JsonProperty("category", String, true)
  public category: string = undefined;

  @JsonProperty("id", String, true)
  public id: string = undefined;

  @JsonProperty("name", String, true)
  public name: string = undefined;

  @JsonProperty("type", String, true)
  public type: string = undefined;

  @JsonProperty("typeKey", String, true)
  public typeKey: string = undefined;

  @JsonProperty("defaultValue", undefined, true)
  public defaultValue: any = undefined;

  @JsonProperty("value", undefined, true)
  public value: any = undefined;

  @JsonProperty("values", undefined, true)
  public values: any = undefined; //used to store Array of values. (For Drowpdown)

  public url: any = undefined;
  public toolTipMinValue: number = Number.MIN_SAFE_INTEGER;
  public toolTipMaxValue: number = 2147483647;
  public showToolTipText: string = '';
  public showToolTip: boolean = false;
  public showClearIcon: boolean = false;
  public updatedCheckbox: boolean = false;
  public subValue: object = undefined; //To store the single object's data of an Array of values property.
  public addTabSpace: boolean = false;
  public maskPreference: boolean = false;

  public constructor(init?: Partial<PreferencesCategoryModel>) {
    Object.assign(this, init);
  }

}