import {NvPairModel} from 'shared/models/nvpair.model';

export type InventoryView = 'main' | 'viewer' | 'assign-policy';

export type InventoryStatOptionsModel = {
  protectionThreshold: NvPairModel;
  timeRange: NvPairModel;
};

export class InventoryStatOptionCategoriesModel {
  public header: NvPairModel;
  public categories: Array<NvPairModel>;
  public selection: NvPairModel;
  public tooltip: string;

  constructor(header: NvPairModel, categories: Array<NvPairModel>, tooltip?: string) {
    this.header = header;
    this.categories = categories;
    this.tooltip = tooltip;
  }

  public hasCategories(): boolean {
    return Array.isArray(this.categories) && this.categories.length > 0;
  }
}

export class InventoryAggrCountResult {
  public group: string = undefined;
  public count: number = undefined;
  public responseJson: any = undefined;
}

export class InventoryTotalResult {
  public total: number = undefined;
  public responseJson: any = undefined;
}
