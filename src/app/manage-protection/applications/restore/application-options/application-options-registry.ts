import {ComponentFactory} from '@angular/core';
import {ApplicationSubOptionModel} from 'applications/shared/application-sub-option.model';
import {ApplicationOptionsPage} from 'applications/restore/application-options/application-options-page';

export class ApplicationOptionsRegistry {
  applicationType: string;
  modelClazz: { new(): ApplicationSubOptionModel };
  componentFactory: ComponentFactory<ApplicationOptionsPage<ApplicationSubOptionModel>>;
}
