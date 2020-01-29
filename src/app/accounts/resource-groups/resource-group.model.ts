import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class ResourceGroupModel extends BaseModel {

  @JsonProperty('displayName', String, true)
  public displayName: string = undefined;

  @JsonProperty('type', String, true)
  public type: string = undefined;

  @JsonProperty('description', String, true)
  public description: string = undefined;

  @JsonProperty('resources', [], true)
  public resources: Array<any> = [];

  method: string;
  template: ResourceGroupModel;

  get canned(): boolean {
    return !this.isUpdateAllowed() && !this.isDeleteAllowed() && this.getActionLinks().length < 1;
  }

  /**
   * Returns an object contains the info needs to be persisted.
   * @returns {{}}
   */
  public getPersistentJson(): Object {
    let me = this;
    return {
      name: me.name,
      description: '',
      resources: this.resources
    };
  }

  /**
   * Returns an object contains the info needs to be updated.
   * @returns {{}}
   */
  public getUpdateJson(): Object {
    return this.getPersistentJson();
  }
}
