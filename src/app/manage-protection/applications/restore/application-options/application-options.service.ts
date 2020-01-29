import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {ApplicationOptionsRegistry} from 'applications/restore/application-options/application-options-registry';
import {ApplicationSubOptionModel} from 'applications/shared/application-sub-option.model';
import {ApplicationOptionsPage} from 'applications/restore/application-options/application-options-page';
import {Db2RestoreOptionsComponent} from 'applications/restore/db2-restore-options/db2-restore-options.component';
import {
  OracleRestoreOptionsComponent
} from 'applications/restore/oracle-restore-options/oracle-restore-options.component';
import {
  SqlRestoreOptionsComponent
} from 'applications/restore/sql-restore-options/sql-restore-options.component';
import {ExchRestoreOptionsComponent} from 'applications/restore/exch-restore-options/exch-restore-options.component';
import {MongoRestoreOptionsComponent} from 'applications/restore/mongo-restore-options/mongo-restore-options.component';
import { ExchonlineRestoreOptionsComponent } from '../exchonline-restore-options/exchonline-restore-options.component';

@Injectable()
export class ApplicationOptionsService {

  constructor(private resolver: ComponentFactoryResolver) {
  }

  public getRegistry(applicationType: string): ApplicationOptionsRegistry {
    let registry = new ApplicationOptionsRegistry();
    registry.applicationType = applicationType;
    registry.modelClazz = this.getModelClass(applicationType);
    registry.componentFactory = this.getComponentFactory(applicationType);
    return registry;
  }

  private getModelClass(applicationType: string): { new(): ApplicationSubOptionModel } {
    return ApplicationSubOptionModel;
  }

  private getComponentFactory(applicationType: string):
    ComponentFactory<ApplicationOptionsPage<ApplicationSubOptionModel>> {

    let factory: ComponentFactory<Db2RestoreOptionsComponent | OracleRestoreOptionsComponent |
      ExchRestoreOptionsComponent | ExchonlineRestoreOptionsComponent | SqlRestoreOptionsComponent | MongoRestoreOptionsComponent>;
    switch (applicationType) {
      case 'db2':
        factory = this.resolver.resolveComponentFactory<Db2RestoreOptionsComponent>(
          Db2RestoreOptionsComponent);
        break;
      case 'oracle':
        factory = this.resolver.resolveComponentFactory<OracleRestoreOptionsComponent>(
          OracleRestoreOptionsComponent);
        break;
      case 'exch':
        factory = this.resolver.resolveComponentFactory<ExchRestoreOptionsComponent>(
          ExchRestoreOptionsComponent);
        break;
      case 'office365':
        factory = this.resolver.resolveComponentFactory<ExchonlineRestoreOptionsComponent>(
          ExchonlineRestoreOptionsComponent);
        break;
      case 'sql':
        factory = this.resolver.resolveComponentFactory<SqlRestoreOptionsComponent>(
          SqlRestoreOptionsComponent);
        break;
      case 'mongo':
        factory = this.resolver.resolveComponentFactory<MongoRestoreOptionsComponent>(
          MongoRestoreOptionsComponent);
        break;
      default:
        break;
    }

    return factory;
  }
}
