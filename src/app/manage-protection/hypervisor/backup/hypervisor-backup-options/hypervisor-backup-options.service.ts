import {ComponentFactory, ComponentFactoryResolver, Injectable} from '@angular/core';
import {HypervisorBackupOptionsModel} from '../../shared/hypervisor-backup-options.model';
import {HypervisorModel} from 'hypervisor/shared/hypervisor.model';
import {
  HypervisorBackupOptionsPage
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-page';
import {HypervBackupOptionsComponent} from 'hypervisor/backup/hyperv-backup-options/hyperv-backup-options.component';
import {VmwareBackupOptionsComponent} from 'hypervisor/backup/vmware-backup-options/vmware-backup-options.component';
import {
  HypervisorBackupOptionsRegistry
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-registry';

@Injectable()
export class HypervisorBackupOptionsService {

  constructor(private resolver: ComponentFactoryResolver) {
  }

  public getRegistry(hypervisorType: string): HypervisorBackupOptionsRegistry {
    let registry = new HypervisorBackupOptionsRegistry();
    registry.hypervisorType = hypervisorType;
    registry.modelClazz = this.getModelClass(hypervisorType);
    registry.componentFactory = this.getComponentFactory(hypervisorType);
    return registry;
  }

  private getModelClass(hypervisorType: string): { new(): HypervisorBackupOptionsModel } {
    return HypervisorBackupOptionsModel;
  }

  private getComponentFactory(hypervisorType: string):
    ComponentFactory<HypervisorBackupOptionsPage<HypervisorBackupOptionsModel>> {
    const factory: ComponentFactory<HypervBackupOptionsComponent | VmwareBackupOptionsComponent> =
      this.isHyperV(hypervisorType) ?
        this.resolver.resolveComponentFactory<HypervBackupOptionsComponent>(
          HypervBackupOptionsComponent) :
        this.resolver.resolveComponentFactory<VmwareBackupOptionsComponent>(
          VmwareBackupOptionsComponent);
    return factory;
  }

  private isHyperV(hypervisorType: string): boolean {
    return hypervisorType === HypervisorModel.TYPE_HYPERV;
  }
}
