import { BaseModel } from 'shared/models/base.model';
import { JsonObject, JsonProperty } from 'json2typescript';
import { DatasetModel, HasAPI } from 'shared/models/dataset.model';
import { ProgressTableResourceModel } from './progress-table-resource.model';


@JsonObject
export class ProgressTableResourcesModel extends DatasetModel<ProgressTableResourceModel> {

    @JsonProperty('vmsummarys', [ProgressTableResourceModel])
    public vmsummarys: Array<ProgressTableResourceModel> = [];

    public getRecords(): Array<ProgressTableResourceModel> {
        return this.vmsummarys;
      }

}