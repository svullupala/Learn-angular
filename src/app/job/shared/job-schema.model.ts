import {BaseModel} from 'shared/models/base.model';
import {JsonConvert, JsonObject, JsonProperty} from 'json2typescript';
import {JobParameterModel} from './job-parameter.model';
import {HateoasModel} from 'shared/models/hateoas.model';


@JsonObject
export class JobSchemaModel extends BaseModel {

  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('version', String, true)
  public version: string = undefined;

  @JsonProperty('parameter', Object, true)
  public parameter: Object = undefined;


  get parameterItems(): Array<JobParameterModel> {
    let me = this,
      all = me.parameter || {},
      items: JobParameterModel[] = [];

    HateoasModel.each(all, function (key, value) {
      let item = me.getParameterItem(key);
      if (item)
        items.push(item);
    }, me);

    return items;
  }

  getParameterItem(key: string): JobParameterModel {
    let me = this,
      item;
    try {
      item = JsonConvert.deserializeObject(me.parameter[key], JobParameterModel);
      item.key = key;
    }
    catch (e) {
      item = undefined;
    }
    return item;
  }

  setParameterItem(key: string, item: JobParameterModel): void {
    if (this.parameter)
      this.parameter[key] = item.schemaJson();
  }
}
