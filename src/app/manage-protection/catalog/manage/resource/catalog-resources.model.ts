import {JsonObject, JsonProperty} from 'json2typescript';
import {CatalogResourceModel} from './catalog-resource.model';
import {DatasetModel, HasAPI} from 'shared/models/dataset.model';

@JsonObject
export class CatalogResourcesModel extends DatasetModel<CatalogResourceModel> implements HasAPI {
    public results: CatalogResourceModel[] = [];

    public getRecords(): Array<CatalogResourceModel> {
      return this.results;
    }

    @JsonProperty('vms', [CatalogResourceModel], true)
    public vms: CatalogResourceModel[] = [];

    @JsonProperty('databases', [CatalogResourceModel], true)
    public databases: CatalogResourceModel[] = [];

    @JsonProperty('contents', [CatalogResourceModel], true)
    public contents: CatalogResourceModel[] = [];

    api(): string {
      return 'api/hypervisor/search?resourceType=vm&from=recovery';
    }
}
