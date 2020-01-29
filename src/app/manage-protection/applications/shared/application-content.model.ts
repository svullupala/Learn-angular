import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseApplicationModel} from './base-application-model.model';

@JsonObject
export class ApplicationContentModel extends BaseApplicationModel {

  @JsonProperty('hasRmanCatalog', Boolean, true)
  public hasRmanCatalog: boolean = false;

  @JsonProperty('logfiles', [], true)
  public logfiles = [];

  @JsonProperty('datafiles', [], true)
  public datafiles = [];
}
