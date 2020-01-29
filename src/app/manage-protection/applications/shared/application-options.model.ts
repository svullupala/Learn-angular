import { JsonObject, JsonProperty } from 'json2typescript';
import { ApplicationSubOptionModel } from './application-sub-option.model';

@JsonObject
export class ApplicationOptionsModel {

  @JsonProperty('makepermanent', String, true)
  public makepermanent: string = 'enabled';

  @JsonProperty('autocleanup', Boolean, true)
  public autocleanup: boolean = true;

  @JsonProperty('continueonerror', Boolean, true)
  public continueonerror: boolean = true;

  @JsonProperty('protocolpriority', String, true)
  public protocolpriority: string = 'iSCSI';

  @JsonProperty('applicationOption', ApplicationSubOptionModel, true)
  public applicationOption: ApplicationSubOptionModel = undefined;
}
