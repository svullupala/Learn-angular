export class CatalogSearchOptionsModel {
  constructor(public jobName: string,
              public dateRange?: Date[],
              public type?: string) {

  }

  json(): Object {
    let me = this;
    return {
      jobName: me.jobName,
      type: me.type,
      dateRange: me.dateRange
    };
  }
}
