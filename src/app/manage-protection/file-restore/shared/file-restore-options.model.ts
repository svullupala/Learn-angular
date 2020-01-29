export class FileRestoreOptionsModel {
  constructor(public overwriteExistingFolderFile: boolean,
              public restoreFileToOriginal: boolean,
              public targetPath: string,
              public destinationVM?: { id: string, name: string, href: string }) {

  }

  json(): Object {
    let me = this;
    return {
      overwriteExistingFolderFile: me.overwriteExistingFolderFile,
      restoreFileToOriginal: me.restoreFileToOriginal,
      destinationVM: me.destinationVM,
      targetPath: me.targetPath
    };
  }

  /**
   * Constructs a copy of this model.
   * Don't use deep-copy(clone) because of performance concern.
   *
   * @returns {FileRestoreOptionsModel}
   */
  public copy(): FileRestoreOptionsModel {
    let target = new FileRestoreOptionsModel(false, true, '');
    Object.assign(target, this);
    if (this.destinationVM)
      target.destinationVM = Object.assign({}, this.destinationVM);
    return target;
  }
}
