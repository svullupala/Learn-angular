import {Component, ElementRef, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'ba-card',
  templateUrl: './baCard.html',
  styleUrls: ['./baCard.scss']
})
export class BaCard {
  @Input() title: String;
  @Input() baCardClass: String;
  @Input() baCardBodyClass: String;
  @Input() bodyTitle: String;
  @Input() bodyTitleIcon: String;
  @Input() buttonLabel: String;
  @Input() cardLinkIcon: String;
  @Input() cardLinkCls: String;
  @Input() cardType: String;
  @Input() imageSrc: String;
  @Input() imageAltText: String;
  @Input() hidden: boolean = false;

  @Output() onClick: EventEmitter<void> = new EventEmitter<void>(); 
  @Output() onCardClick: EventEmitter<void> = new EventEmitter<void>();

  constructor(public elementRef: ElementRef) {
  }

  private _onClick(): void {
    this.onClick.emit();
  }

  private _onCardClick(): void {
    this.onCardClick.emit();
  }
}
