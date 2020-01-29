import {
  Component, Input, Output, EventEmitter, ViewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {FileRestoreOptionsModel} from '../file-restore-options.model';
import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {VmSearchSelectComponent} from '../vm-search-select/vm-search-select.component';
import {KeyboardTabDirectionProvider} from 'shared/util/keyboard';

@Component({
  selector: 'file-restore-options',
  styleUrls: ['./file-restore-options.component.scss'],
  templateUrl: './file-restore-options.component.html',
})
export class FileRestoreOptionsComponent extends KeyboardTabDirectionProvider {
  @Input() hypervisorType: string;

  @ViewChild(VmSearchSelectComponent) vmSearchSelect: VmSearchSelectComponent;

  private model: FileRestoreOptionsModel;
  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;

  constructor(private translate: TranslateService) {
    super();
    this.model = new FileRestoreOptionsModel(false, true, '');
  }

  isValid(): boolean {
    return this.model && (this.model.restoreFileToOriginal || !!this.model.destinationVM);
  }

  getValue(): FileRestoreOptionsModel {
    if (this.model.restoreFileToOriginal) {
      this.model.targetPath = '';
      this.onVmDeselect();
      this.vmSearchSelect.emptySelection(false, true);
    }
    return this.model;
  }

  private onVmSelect(vm: BaseHypervisorModel): void {
    this.model.destinationVM = {
      id: vm.id,
      name: vm.name,
      href: vm.getId()
    };
  }

  private onVmDeselect(vm?: BaseHypervisorModel): void {
    this.model.destinationVM = undefined;
  }
}


