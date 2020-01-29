import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';


export abstract class ApplicationBackupOptionsPage<T extends ApplicationBackupOptionsModel> {

  public model: T;

  public abstract getOptions(): T;

  public abstract setOptions(options?: T): void;

  public abstract isValid(): boolean;

  public resetLogBackupValid(selections: Array<BaseApplicationModel>): void {}

  public setSelections(selections: Array<BaseApplicationModel>): void {}

  public setView(view: string): void {}
}
