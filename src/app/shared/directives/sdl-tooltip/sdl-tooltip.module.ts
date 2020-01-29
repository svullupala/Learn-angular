import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { SdlTooltipContainerComponent } from './sdl-tooltip-container.component';
import { SdlTooltipDirective } from './sdl-tooltip.directive';
import { SdlTooltipConfig } from './sdl-tooltip.config';
import {ComponentLoaderFactory, PositioningService} from 'ngx-bootstrap';

@NgModule({
  imports: [CommonModule],
  declarations: [SdlTooltipDirective, SdlTooltipContainerComponent],
  exports: [SdlTooltipDirective],
  entryComponents: [SdlTooltipContainerComponent]
})
export class SdlTooltipModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SdlTooltipModule,
      providers: [SdlTooltipConfig, ComponentLoaderFactory, PositioningService]
    };
  }
}
