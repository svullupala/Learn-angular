import { BaseModel } from 'shared/models/base.model';
import { JsonObject, JsonProperty } from 'json2typescript';

@JsonObject
export class ProgressTableResourceModel extends BaseModel {

    @JsonProperty('vmName', String, true)
    public vmName: string = undefined;

    @JsonProperty('host', String, true)
    public host: string = undefined;

    @JsonProperty('location', String, true)
    public location: string = undefined;

    @JsonProperty('vSnapUsed', String, true)
    public vSnapUsed: string = undefined;

    @JsonProperty('vsnapVolumes', String, true)
    public vsnapVolumes: object = undefined;

    @JsonProperty('proxyUsed', String, true)
    public proxyUsed: string = undefined;

    @JsonProperty('throughPut', String, true)
    public throughPut: string = undefined;

    @JsonProperty('percentageCompleted', Number, true)
    public percentageCompleted: number = null;

    public constructor(init?: Partial<ProgressTableResourceModel>) {
        super();
        Object.assign(this, init);
      }
    
}