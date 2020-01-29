import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'confirm-toolbar-component',
  template: `
    <div class="footer">
      <div *ngIf="splitButtons; then split else notsplit"></div>
      <ng-template #split>
        <button [hidden]="hideCancelButton"
                [disabled]="disableCancelButton"
                (click)="onCancel()"
                [ngClass]="{'small': !largeBtn, 'disabled': disableCancelButton}"
                class="sdl inline secondary margin-right-1rem" type="button">{{ cancelText }}</button>
        <button [hidden]="hideConfirmButton"
                [disabled]="disableConfirmButton"
                (click)="onConfirm()"
                type="button"
                [ngClass]="{'small': !largeBtn, 'disabled': disableConfirmButton}"
                class="sdl inline">{{ confirmText }}</button>
      </ng-template>
      <ng-template #notsplit>
        <div [class]="floatRight ?  'align-right' : 'align-left'">
          <button [hidden]="hideCancelButton"
                  [disabled]="disableCancelButton"
                  (click)="onCancel()"
                  class="sdl inline secondary margin-right-1rem"
                  [ngClass]="{'small': !largeBtn, 'disabled': disableCancelButton}"
                  type="button">{{ cancelText }}</button>
          <button [hidden]="hideConfirmButton"
                  [disabled]="disableConfirmButton"
                  (click)="onConfirm()"
                  class="sdl inline"
                  type="button"
                  [ngClass]="{'small': !largeBtn, 'disabled': disableConfirmButton}"
                  >{{ confirmText }}</button>
        </div>
      </ng-template>
    </div>
  `
})

export class ConfirmToolbarComponent {
  @Input() hideConfirmButton: boolean = false;
  @Input() hideCancelButton: boolean = false;
  @Input() disableConfirmButton: boolean = false;
  @Input() disableCancelButton: boolean = false;
  @Input() largeBtn: boolean = true;
  @Input() splitButtons: boolean = false;
  @Input() floatRight: boolean = true;
  @Input() confirmText: string;
  @Input() cancelText: string;
  @Output() confirmEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancelEvent: EventEmitter<void> = new EventEmitter<void>();

  constructor(private translate: TranslateService){
  }

  ngOnInit() {
    this.translate.get([
      'common.textCancel',
      'common.textSave'
    ]).subscribe((resource: Object) => {
      this.cancelText = this.cancelText ? this.cancelText : resource['common.textCancel'];
      this.confirmText = this.confirmText ? this.confirmText : resource['common.textSave'];
    });

  }

  private onConfirm(): void {
    this.confirmEvent.emit();
  }

  private onCancel(): void {
    this.cancelEvent.emit();
  }
}
