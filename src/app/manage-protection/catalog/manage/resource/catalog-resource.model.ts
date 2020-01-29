import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class CatalogResourceModel extends BaseModel {
  @JsonProperty('id', String, true)
  public id: string = undefined;

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('host', String, true)
  public host: string = undefined;

  @JsonProperty('location', String, true)
  public location: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('hypervisorType', String, true)
  public hypervisorType: string = undefined;

  public get locationString(): string {
    if (this.host) {
        return this.host;
    } else if (this.location) {
        return this.location;
    } else {
      return this.id;
    }
  }

	public get typeString(): string {
		if (this.hypervisorType) {
			return this.hypervisorType;
		} else if (this.type) {
			return this.type;
    } else {
			return '';
		}
  }
}
