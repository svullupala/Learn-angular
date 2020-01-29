import {
  Directive,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2, SimpleChanges,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {ComponentLoader, ComponentLoaderFactory, OnChange} from 'ngx-bootstrap';
import {timer} from 'rxjs/observable/timer';
import {parseTriggers} from 'ngx-bootstrap/utils/triggers';
import { SdlTooltipContainerComponent } from './sdl-tooltip-container.component';
import { SdlTooltipConfig } from './sdl-tooltip.config';
import {isString} from 'util';

@Directive({
  selector: '[sdlTooltip]',
  exportAs: 'sdl-tooltip'
})
export class SdlTooltipDirective implements OnInit, OnDestroy, OnChanges {
  /**
   * Content to be displayed as tooltip.
   */
  @OnChange()
  @Input()
  sdlTooltip: string | TemplateRef<any>;
  /** Fired when tooltip content changes */
  @Output()
  tooltipChange: EventEmitter<string | TemplateRef<any>> = new EventEmitter();

  /**
   * Placement of a tooltip. Accepts: "top", "bottom", "left", "right"
   */
  @Input() placement: string;
  /**
   * Specifies events that should trigger. Supports a space separated list of
   * event names.
   */
  @Input() triggers: string;
  /**
   * A selector specifying the element the tooltip should be appended to.
   * Currently only supports "body".
   */
  @Input() container: string;

  /**
   * Returns whether or not the tooltip is currently being shown
   */
  @Input()
  get isOpen(): boolean {
    return this._tooltip.isShown;
  }

  set isOpen(value: boolean) {
    if (value) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Allows to disable tooltip
   */
  @Input() isDisabled: boolean;

  /**
   * Hide icon
   */
  @Input() iconHidden: boolean;

  /**
   * Css class for tooltip container
   */
  @Input() containerClass = '';
  /**
   * Delay before showing the tooltip
   */
  @Input() delay: number;

  /**
   * Mode of the tooltip. Accepts: "standard", "info", "critical", "warning"
   */
  @Input() mode: string = 'standard';

  /**
   * Emits an event when the tooltip is shown
   */
  @Output() onShown: EventEmitter<any>;
  /**
   * Emits an event when the tooltip is hidden
   */
  @Output() onHidden: EventEmitter<any>;


  get attachment(): string {
    let placement = this.placement;
    return ['top', 'bottom'].indexOf(placement) !== -1 ? placement + ' left' : placement;
  }

  protected _delayTimeoutId: number | any;
  protected _tooltipCancelShowFn: Function;

  private _tooltip: ComponentLoader<SdlTooltipContainerComponent>;
  private _fadeDuration = 150;

  constructor(_viewContainerRef: ViewContainerRef,
                     private _renderer: Renderer2,
                     private _elementRef: ElementRef,
                     cis: ComponentLoaderFactory,
                     config: SdlTooltipConfig) {
    this._tooltip = cis
      .createLoader<SdlTooltipContainerComponent>(
        this._elementRef,
        _viewContainerRef,
        this._renderer
      )
      .provide({provide: SdlTooltipConfig, useValue: config});

    Object.assign(this, config);
    this.onShown = this._tooltip.onShown;
    this.onHidden = this._tooltip.onHidden;
  }

  ngOnInit(): void {
    this._tooltip.listen({
      triggers: this.triggers,
      show: () => this.show()
    });
    this.tooltipChange.subscribe((value: any) => {
      if (!value) {
        this._tooltip.hide();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['isDisabled'] && changes['isDisabled'].currentValue === true) {
      me.hide();
    }
  }

  /**
   * Toggles an element’s tooltip. This is considered a “manual” triggering of
   * the tooltip.
   */
  toggle(): void {
    if (this.isOpen) {
      return this.hide();
    }

    this.show();
  }

  /**
   * Opens an element’s tooltip. This is considered a “manual” triggering of
   * the tooltip.
   */
  show(): void {
    if (
      this.isOpen ||
      this.isDisabled ||
      this._delayTimeoutId ||
      !this.sdlTooltip
    ) {
      return;
    }

    const showTooltip = () => {
      if (this._delayTimeoutId) {
        this._delayTimeoutId = undefined;
      }

      this._tooltip
        .attach(SdlTooltipContainerComponent)
        .to(this.container)
        .position({attachment: this.attachment})
        .show({
          content: this.sdlTooltip,
          placement: this.placement,
          mode: this.mode,
          isTextContent: isString(this.sdlTooltip),
          iconHidden: this.iconHidden,
          containerClass: this.containerClass
        });
    };
    const cancelDelayedTooltipShowing = () => {
      if (this._tooltipCancelShowFn) {
        this._tooltipCancelShowFn();
      }
    };

    if (this.delay) {
      const _timer = timer(this.delay).subscribe(() => {
        showTooltip();
        cancelDelayedTooltipShowing();
      });

      if (this.triggers) {
        const triggers = parseTriggers(this.triggers);
        this._tooltipCancelShowFn = this._renderer.listen(this._elementRef.nativeElement, triggers[0].close, () => {
          _timer.unsubscribe();
          cancelDelayedTooltipShowing();
        });
      }
    } else {
      showTooltip();
    }
  }

  /**
   * Closes an element’s tooltip. This is considered a “manual” triggering of
   * the tooltip.
   */
  hide(): void {
    if (this._delayTimeoutId) {
      clearTimeout(this._delayTimeoutId);
      this._delayTimeoutId = undefined;
    }

    if (!this._tooltip.isShown) {
      return;
    }

    this._tooltip.instance.classMap.in = false;
    setTimeout(() => {
      this._tooltip.hide();
    }, this._fadeDuration);
  }

  ngOnDestroy(): void {
    this._tooltip.dispose();
  }
}
