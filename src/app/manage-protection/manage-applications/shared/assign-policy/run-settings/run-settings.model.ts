export class ApplicationsRunSettingsDynamicOptions {
  public logBackup: boolean;
  public parallelStreamRadio: boolean;
  public truncateSourceLogs: boolean;
  public primaryLogRetention: boolean;
  public backupPreferredNode: boolean;

  constructor(
    options: {
      logBackup?: boolean;
      parallelStreamRadio?: boolean;
      truncateSourceLogs?: boolean;
      primaryLogRetention?: boolean;
      backupPreferredNode?: boolean;
    } = {}
  ) {
    this.logBackup = options.logBackup || false;
    this.parallelStreamRadio = options.parallelStreamRadio || false;
    this.truncateSourceLogs = options.truncateSourceLogs || false;
    this.primaryLogRetention = options.primaryLogRetention || false;
    this.backupPreferredNode = options.backupPreferredNode || false;
  }
}
