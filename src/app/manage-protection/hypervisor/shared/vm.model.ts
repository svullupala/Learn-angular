import {BaseModel} from 'shared/models/base.model';
import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseHypervisorModel} from './base-hypervisor.model';

@JsonObject
export class VmModel extends BaseHypervisorModel {

  /**
   * Returns true if the given model equals this model.
   * @param another The given model
   * @returns {boolean}
   */
  public equals(another: BaseModel): boolean {
    // Use id & resourceType matching for now, until the new API 'api/hypervisor/<id>/vm'
    // can return correct self link for each vm.
    return another.id === this.id && another.resourceType === another.resourceType;
  }
}
