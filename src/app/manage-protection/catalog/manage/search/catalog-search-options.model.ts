export class CatalogSearchOptionsModel {
  constructor(public jobName: string,
              public dateRange?: Date[],
              public type?: string,
              public subPolicyType?: string) {

  }

  json(): Object {
    let me = this;
    return {
      jobName: me.jobName,
      type: me.type,
      subPolicyType: me.subPolicyType,
      dateRange: me.dateRange
    };
  }
}
