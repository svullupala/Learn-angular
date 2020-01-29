import {HypervisorBackupOptionsModel} from '../../shared/hypervisor-backup-options.model';
import {IdentityUserEnterSelectModel} from 'identity/shared/identity-user-enter-select.model';
import {EventEmitter, Output} from '@angular/core';
import {IdentityModel} from '../../../../accounts/identities/identity.model';


export abstract class HypervisorBackupOptionsPage<T extends HypervisorBackupOptionsModel> {

  public model: T;

  public loadedUserEvent: EventEmitter<any> = new EventEmitter<any>();

  public loadedVADPsEvent: EventEmitter<any> = new EventEmitter<any>();

  public abstract getOptions(): Object;

  public abstract setOptions(options?: T): void;

  public abstract getUserInfo(): IdentityUserEnterSelectModel;

  public abstract getExistingUserHref(): string;

  public abstract getExistingKeyHref(): string;

  public abstract reloadUsers(): void;
}
