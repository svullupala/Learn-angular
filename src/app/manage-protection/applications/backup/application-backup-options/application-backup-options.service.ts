import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {
  ApplicationBackupOptionsRegistry
} from 'applications/backup/application-backup-options/application-backup-options-registry';
import {
  ApplicationBackupOptionsPage
} from 'applications/backup/application-backup-options/application-backup-options-page';
import {Db2BackupOptionsComponent} from 'applications/backup/db2-backup-options/db2-backup-options.component';
import {ExchBackupOptionsComponent} from 'applications/backup/exch-backup-options/exch-backup-options.component';
import {ExchOnlineBackupOptionsComponent} from 'applications/backup/exchonline-backup-options/exchonline-backup-options.component';
import {MongoBackupOptionsComponent} from 'applications/backup/mongo-backup-options/mongo-backup-options.component';
import {OracleBackupOptionsComponent} from 'applications/backup/oracle-backup-options/oracle-backup-options.component';
import {SqlBackupOptionsComponent} from 'applications/backup/sql-backup-options/sql-backup-options.component';
import { KubernetesBackupOptionsComponent } from '../kubernetes-backup-options/kubernetes-backup-options.component';

@Injectable()
export class ApplicationBackupOptionsService {

  constructor(private resolver: ComponentFactoryResolver) {
  }

  public getRegistry(applicationType: string): ApplicationBackupOptionsRegistry {
    let registry = new ApplicationBackupOptionsRegistry();
    registry.applicationType = applicationType;
    registry.modelClazz = this.getModelClass(applicationType);
    registry.componentFactory = this.getComponentFactory(applicationType);
    return registry;
  }

  private getModelClass(applicationType: string): { new(): ApplicationBackupOptionsModel } {
    return ApplicationBackupOptionsModel;
  }

  private  getComponentFactory(applicationType: string):
    ComponentFactory<ApplicationBackupOptionsPage<ApplicationBackupOptionsModel>> {

    let factory: ComponentFactory<Db2BackupOptionsComponent | ExchBackupOptionsComponent |
    ExchOnlineBackupOptionsComponent | MongoBackupOptionsComponent | OracleBackupOptionsComponent |
    SqlBackupOptionsComponent | KubernetesBackupOptionsComponent>;
    switch (applicationType) {
      case 'db2':
        factory = this.resolver.resolveComponentFactory<Db2BackupOptionsComponent>(
          Db2BackupOptionsComponent);
        break;
      case 'exch':
        factory = this.resolver.resolveComponentFactory<ExchBackupOptionsComponent>(
          ExchBackupOptionsComponent);
        break;
      case 'office365':
        factory = this.resolver.resolveComponentFactory<ExchOnlineBackupOptionsComponent>(
          ExchOnlineBackupOptionsComponent);
        break;
      case 'mongo':
        factory = this.resolver.resolveComponentFactory<MongoBackupOptionsComponent>(
          MongoBackupOptionsComponent);
        break;
      case 'oracle':
        factory = this.resolver.resolveComponentFactory<OracleBackupOptionsComponent>(
          OracleBackupOptionsComponent);
        break;
      case 'k8s':
        factory = this.resolver.resolveComponentFactory<KubernetesBackupOptionsComponent>(
          KubernetesBackupOptionsComponent);
        break;
      case 'sql':
        factory = this.resolver.resolveComponentFactory<SqlBackupOptionsComponent>(
          SqlBackupOptionsComponent);
        break;
      default:
        break;
    }

    return factory;
  }
}
