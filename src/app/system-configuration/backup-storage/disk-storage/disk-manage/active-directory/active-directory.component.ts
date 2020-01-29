import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JoinActiveDirectoryModel, LeaveActiveDirectoryModel } from './active-directory.model';
import { StorageManageService } from 'diskstorage/shared/storage-manage.service';
import { StorageModel } from 'diskstorage/shared/storage.model';
import { AlertComponent, ErrorHandlerComponent, AlertType } from 'shared/components';
import { SessionService } from 'core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'active-directory',
    templateUrl: './active-directory.component.html',
    styleUrls: ['./active-directory.component.scss'],
})

export class ActiveDirectoryComponent implements OnInit, OnDestroy {
    @Input() storageItem: StorageModel;
    @Output() maskActiveDirectory = new EventEmitter<boolean>();
    @Output() onCancelClick = new EventEmitter();

    alert: AlertComponent;
    errorHandler: ErrorHandlerComponent;

    private textJoinSuccess: string;
    private textLeaveSuccess: string;
    private textVsnapJoined: string;
    private textVsnapRemoved: string;

    private joinActiveDirectoryModel: JoinActiveDirectoryModel;
    private leaveActiveDirectoryModel: LeaveActiveDirectoryModel;
    private form: FormGroup;
    private qualifiedDomainNamevSnap: AbstractControl;
    private activeDirectoryServerUsername: AbstractControl;
    private activeDirectoryServerPassword: AbstractControl;
    private subs: Subject<void> = new Subject<void>();

    constructor(private fb: FormBuilder, private storageManageService: StorageManageService, private translate: TranslateService) {
        this.form = fb.group({
            'qualifiedDomainNamevSnap': ['', Validators.compose([Validators.required])],
            'activeDirectoryServerUsername': ['', Validators.compose([Validators.required])],
            'activeDirectoryServerPassword': ['', Validators.compose([Validators.required])],
        });
        this.qualifiedDomainNamevSnap = this.form.controls['qualifiedDomainNamevSnap'];
        this.activeDirectoryServerUsername = this.form.controls['activeDirectoryServerUsername'];
        this.activeDirectoryServerPassword = this.form.controls['activeDirectoryServerPassword'];
    }

    ngOnInit() {
        this.translate.get([
            'storage.activeDirectory.textJoinSuccess',
            'storage.activeDirectory.textLeaveSuccess',
            'storage.activeDirectory.textVsnapJoined',
            'storage.activeDirectory.textVsnapRemoved',
        ]).takeUntil(this.subs)
            .subscribe((resource: Object) => {
                this.textJoinSuccess = resource['storage.activeDirectory.textJoinSuccess'];
                this.textLeaveSuccess = resource['storage.activeDirectory.textLeaveSuccess'];
                this.textVsnapJoined = resource['storage.activeDirectory.textVsnapJoined'];
                this.textVsnapRemoved = resource['storage.activeDirectory.textVsnapRemoved'];
            });
        this.errorHandler = SessionService.getInstance().context['errorHandler'];
        this.alert = SessionService.getInstance().context['msgbox.alert'];
    }

    ngOnDestroy() {
      this.subs.next();
      this.subs.complete();
      this.subs.unsubscribe();
    }

    get showField(): boolean {
      return this.storageItem && this.storageItem.activeDirectoryInfo == null;
    }

    public isJoined(): boolean {
        return !this.showField;
    }

    public onCancel() {
        this.form.reset();
        this.onCancelClick.emit()
    }

    public onJoin() {
        this.joinActiveDirectoryModel = new JoinActiveDirectoryModel({
            domain: this.qualifiedDomainNamevSnap.value,
            username: this.activeDirectoryServerUsername.value,
            password: this.activeDirectoryServerPassword.value
        });
        this.postJoinActiveDirectoryData(this.storageItem, this.joinActiveDirectoryModel);
    }

    private postJoinActiveDirectoryData(storageItem, joinActiveDirectoryModel) {
        this.maskActiveDirectory.emit(true);
        this.storageManageService.joinActiveDirectory(storageItem, joinActiveDirectoryModel)
            .takeUntil(this.subs)
            .subscribe(
                data => {
                  this.alert.show(this.textJoinSuccess, this.textVsnapJoined, AlertType.CONFIRMATION)
                  this.maskActiveDirectory.emit(false);
                },
                error => {
                    this.maskActiveDirectory.emit(false);
                    this.errorHandler.handle(error);
                },
                () => {
                    this.maskActiveDirectory.emit(false);
                    this.refresh();
                }
            );
    }

    public onLeave() {
        this.leaveActiveDirectoryModel = new LeaveActiveDirectoryModel({
            username: this.activeDirectoryServerUsername.value,
            password: this.activeDirectoryServerPassword.value
        });
        this.postLeaveActiveDirectoryData(this.storageItem, this.leaveActiveDirectoryModel);
    }

    private postLeaveActiveDirectoryData(storageItem, leaveActiveDirectoryModel) {
        this.maskActiveDirectory.emit(true);
        this.storageManageService.leaveActiveDirectory(storageItem, leaveActiveDirectoryModel)
            .takeUntil(this.subs)
            .subscribe(
                data => {
                    this.alert.show(this.textLeaveSuccess, this.textVsnapRemoved, AlertType.CONFIRMATION)
                    this.maskActiveDirectory.emit(false);
                },
                error => {
                    this.maskActiveDirectory.emit(false);
                    this.errorHandler.handle(error);
                },
                () => {
                    this.maskActiveDirectory.emit(false);
                    this.refresh();
                }
            );
    }

    private refresh() {
      let me = this;
      me.storageManageService.refresh(me.storageItem)
        .takeUntil(me.subs)
        .subscribe(
          data => {
              me.storageItem = data;
              me.resetForm();
          }
        );
    }

    private resetForm() {
        this.qualifiedDomainNamevSnap.reset();
        this.activeDirectoryServerPassword.reset();
        this.activeDirectoryServerUsername.reset();
    }

    public isDisabled(): boolean {
        if (this.showField && this.form.invalid) {
            return true;
        }
        else if (!this.showField) {
            if (this.activeDirectoryServerUsername.invalid || this.activeDirectoryServerPassword.invalid) {
                return true;
            }
        }
        return false;
    }

}
