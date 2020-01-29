import {ApplicationSubOptionModel} from 'applications/shared/application-sub-option.model';

export abstract class ApplicationOptionsPage<T extends ApplicationSubOptionModel> {

  public model: T;

  public restoreType: string = 'production';

  public abstract getModel(): T;

  public abstract reset(): void;
}
