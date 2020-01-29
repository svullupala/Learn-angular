export class AuditLogSearchOptionsModel {
  constructor(public accessDateRange?: Date[],
              public description?: string) {

  }

  json(): Object {
    let me = this;
    return {
      description: me.description
    };
  }
}
