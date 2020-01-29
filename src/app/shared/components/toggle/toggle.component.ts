import {
  Component, OnInit, Output, Input, EventEmitter
} from '@angular/core';

@Component({
  selector: 'toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent implements OnInit {
  /**
   * Enable (true) Label. Optional. If not provided, show just the toggle by itself.
   */
  @Input() enableLabel: string;
  /**
   * Disable (false) Label. Optional. If not provided, show just the toggle by itself.
   */
  @Input() disableLabel: string;

  /**
   * Event when the toggle is switched; pass the boolean in the event.
   * @type {EventEmitter<boolean>}
   */
  @Output() toggleEvent = new EventEmitter<boolean>();

  /**
   * Color of the slider in Enabled (true) state. Optional. default to '#666666'.
   * @type {string}
   */
  @Input() colorOfSliderEnabled: string = '#666666';

  /**
   * color of the slider in disabled (false) state. optional. default to '#666666'.
   * @type {string}
   */
  @Input() colorOfSliderDisabled: string = '#666666';

  /**
   * Color of the border. Optional. Default to '#666666'.
   * @type {string}
   */
  @Input() colorOfBorder: string = '#666666';

  /**
   * Color of the slider background. Optional. Default to transparent.
   * @type {string}
   */
  @Input() bgColorOfSlider: string = 'transparent';

  /**
   * Optional Hover tooltip.
   */
  @Input() hoverTooltip: string;

  /**
   * Initial state value.
   */
  @Input() initValue: boolean;

  /**
   * Disable (disabled = true) / Enable (disabled = false) this component.
   */
  @Input() disabled: boolean;

  /**
   * Internal state defaults to false.
   * @type {boolean}
   */
  private state: boolean = false;

  /**
   * Public getter to return boolean which indicates current state.
   * @return {boolean}
   */
  get value(): boolean {
    return this.state;
  }

  ngOnInit() {
    this.state = this.initValue || false;
  }

  /**
   * Toggle method to switch Enabled/Disabled state.
   *
   * @method toggle
   * @param {boolean} forceValue Optional value to force the state.
   * @param {boolean} preventEvent Optional value to prevent event.
   */
  toggle(forceValue?: boolean, preventEvent?: boolean): void {
    let me = this, force = forceValue !== undefined;
    me.state = force ? forceValue : !me.state;
    if (!preventEvent)
      me.toggleEvent.emit(me.state);
  }

  private get switchStyle(): object {
    return this.disabled ? {} : {
      borderColor: this.colorOfBorder,
      backgroundColor: this.bgColorOfSlider
    };
  }

  private get sliderStyle(): object {
    return this.disabled ? {} : {
      borderColor: this.value ? this.colorOfSliderEnabled : this.colorOfSliderDisabled,
      backgroundColor: this.value ? this.colorOfSliderEnabled : this.colorOfSliderDisabled
    };
  }
}
