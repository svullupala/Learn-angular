export class FileSearchOptionsModel {
  constructor(public vms: string[],
              public dateRange?: Date[],
              public osType?: string,
              public folderPath?: string) {

  }

  json(): Object {
    let me = this;
    return {
      vms: me.vms,
      // dateRange: me.dateRange,
      osType: me.osType,
      folderPath: me.folderPath
    };
  }
}
