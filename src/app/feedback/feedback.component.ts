import { ViewChild, Component, Input, Output, AfterViewInit, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { FeedbackService } from './feedback.service';
import { OnDestroy } from "@angular/core/src/metadata/lifecycle_hooks";
import { Subscription } from "rxjs/Subscription";

@Component({
  selector: 'feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.scss'],
  providers: [
    FeedbackService
  ]
})
export class FeedbackComponent implements AfterViewInit, OnDestroy {
  @Input() autoShow: boolean = true;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @ViewChild('fbModal') lgModal: ModalDirective;

  sub: Subscription;

  privacyUrl: string = 'https://www.ibm.com/privacy/us/en/';
  feedbackFormUrl: string = 'http://survey.medallia.eu' +
    '?ibm-onprem-offering&offeringId=5737F11&productType=2&testFlag=No&trialUser=No&lang=en&longVersion=Yes';

  constructor(private feedbackService: FeedbackService) {
  }

  ngAfterViewInit() {
    this.autoShow ? this.show() : this.hide();
  }

  show(): void {
    this.sub = this.feedbackService.ping(this.feedbackFormUrl).subscribe(
      res => {
        if (res === true) {
          this.lgModal.show();
          this.showEvent.emit();
          this.feedbackService.popupShown();
        } else {
          console.warn('Unable to reach feedback form.  Not showing pop-up');
        }
      },
      err => {
          console.warn('Unable to reach feedback form.  Not showing pop-up');
      }
    );
  }

  hide(): void {
    this.lgModal.hide();
    this.hideEvent.emit();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private onRemindLaterClick(){
    this.hide();
  }

  private onProvideFeedbackClick(){
    this.hide();
    window.open(this.feedbackFormUrl, '_blank');
  }
}
