import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {ErrorFilled16Module} from '@carbon/icons-angular/lib/error--filled/16';
import {WarningFilled16Module} from '@carbon/icons-angular/lib/warning--filled/16';
import {CheckmarkFilled16Module} from '@carbon/icons-angular/lib/checkmark--filled/16';
import {StatusIconComponent} from 'shared/components/status-icon/status-icon.component';
import {ErrorOutline16Module} from '@carbon/icons-angular/lib/error--outline/16';
import {WarningAlt16Module} from '@carbon/icons-angular/lib/warning--alt/16';
import {CheckmarkOutline16Module} from '@carbon/icons-angular/lib/checkmark--outline/16';
import {SdlTooltipModule} from 'shared/directives/sdl-tooltip';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ErrorFilled16Module,
    WarningFilled16Module,
    CheckmarkFilled16Module,
    ErrorOutline16Module,
    WarningAlt16Module,
    CheckmarkOutline16Module,
    SdlTooltipModule
  ],
  declarations: [
    StatusIconComponent
  ],
  exports: [StatusIconComponent]
})
export class StatusIconModule {
}
