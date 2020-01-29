import { DefineEditScheduleModalComponent } from './components/define-edit-schedule/define-edit-schedule-modal/define-edit-schedule-modal.component';
import {NgModule}      from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule, DecimalPipe} from '@angular/common';
import {BsDropdownModule, ModalModule, TabsModule} from 'ngx-bootstrap';
import {NgaModule} from 'theme/nga.module';
import {TranslationModule} from './translation.module';
import {NgxPaginationModule, PaginatePipe} from 'ngx-pagination';
import {LoaderModule} from './components/loader/loader.module';
import {MomentModule} from 'angular2-moment';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {NgxMaskModule} from 'ngx-mask';
import {CdkTableModule} from '@angular/cdk/table';

import {
  AlertComponent,
  ErrorHandlerComponent,
  PagingToolbarComponent,
  PagingDockbarComponent,
  ChangePasswordComponent,
  InitializeSystemComponent,
  DownloaderComponent,
  AboutDialogComponent,
  CarbonIconComponent,
  SdlSearchBarComponent,
  SdlAsyncSearchBarComponent,
  ConfigGroupsComponent,
  BaMsgCenter,
  BaPageTop,
  DynamicTabsetComponent,
  PercentageDoughnutChartComponent,
  ToggleComponent,
  WizardTopbarComponent,
  WizardToolbarComponent,
  WizardPreviewToolbarComponent,
  WizardSidebarItemComponent,
  WizardSidebarComponent,
  WizardPageContainerComponent,
  WizardStarterComponent,
  WorkflowSelectorComponent,
  WizardReviewPageComponent,
  WizardPreviewPageComponent,
  WizardComponent,
  // TODO: Add more components.
} from './components';

import {
  // TODO: Add more directives.
} from './directives';

import {
  MD5Pipe,
  PagingPipe,
  BooleanPipe,
  FileSizePipe,
  FileSizeObservablePipe,
  StorageSizePipe,
  CommaDelimPipe,
  RoleSecurityGroupNamePipe
  // TODO: Add more pipes.
} from './pipes';

import {SharedService} from './shared.service';
import {WebsocketService} from './websocket.service';
import {RouterExtService} from './router-ext.service';
import {PreferenceService} from './preference.service';
import {CredentialService} from 'identity/shared/credentials/credential.service';
import {FormQuestionService} from './form-question/form-question.service';
import {BasicDynamicForm} from './basic-dynamic-form/basic-dynamic-form.component';
import {RefreshButtonModule} from './components/refresh-button/refresh-button.module';
import {NotificationComponent} from './components/notification/notification.component';
import {DefineSchedule} from './components/define-schedule/define-schedule.component';
import {RpoDisplayPipe} from 'slapolicy/shared/rpo-display.pipe';
import { OnCollapsableButtonDirective } from './directives/on-collapsable-button.directive';
import { FixMultiselectDropdownPositionDirective } from './directives/fix-multiselect-dropdown-position.directive';
import { PostScriptsModule } from './components/post-scripts/post-scripts.module';
import { ConfirmToolbarComponent } from './components/confirm-toolbar/confirm-toolbar.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BaseModalComponent } from './components/base-modal/base-modal.component';
import { BaseDetailsComponent } from './components/base-details-component/base-details.component';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import { PopoverModule } from 'ngx-bootstrap/popover';
import {SdlTooltipModule} from 'shared/directives/sdl-tooltip';
import {DropdownComponent} from 'shared/components/dropdown/dropdown.component';
import {ProgressBarComponent} from 'shared/components/progress-bar/progress-bar.component';
import { FilterDropdownComponent } from 'shared/components/filter-dropdown/filter-dropdown.component';
import { TreeModule } from 'ng2-tree';
import {A11yKeyboardModule} from 'shared/util/keyboard';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import { KeySelectorComponent } from 'shared/components/key-selector/key-selector.component';
import {WeeklyScheduleComponent} from 'shared/components/weekly-schedule/weekly-schedule.component';
import {WizardSummaryPageComponent} from 'shared/components/wizard/summary-page/wizard-summary-page.component';
import { PreferencesCategoryComponent } from './components/preferences-category/preferences-category.component';
import { TimePickerComponent } from 'shared/components/time-picker/time-picker.component';
import {ScrollTabsetComponent} from 'shared/components/sroll-tabset';
import { ScrollTabsetTabsComponent } from 'shared/components/sroll-tabset/tabs/tabs.component';
import {RadioSelectionComponent} from 'shared/components/radio-selection/radio-selection.component';
import {RadioSelectionDirective} from 'shared/components/radio-selection/radio-selection.directive';
import { BaTableComponent } from './components/table/ba-table.component';
import { DynamicCellDirective } from './components/table/dynamic-cell.directive';

const ECX_SHARED_COMPONENTS = [
  AlertComponent,
  BaseModalComponent,
  BaseDetailsComponent,
  BasicDynamicForm,
  ConfirmToolbarComponent,
  ErrorHandlerComponent,
  FilterDropdownComponent,
  PagingToolbarComponent,
  PagingDockbarComponent,
  ChangePasswordComponent,
  InitializeSystemComponent,
  NotificationComponent,
  DefineSchedule,
  KeySelectorComponent,
  WeeklyScheduleComponent,
  DownloaderComponent,
  PercentageDoughnutChartComponent,
  AboutDialogComponent,
  CarbonIconComponent,
  SdlSearchBarComponent,
  SdlAsyncSearchBarComponent,
  ToggleComponent,
  ConfigGroupsComponent,
  PageNotFoundComponent,
  BaMsgCenter,
  BaPageTop,
  DropdownComponent,
  ProgressBarComponent,
  DynamicTabsetComponent,
  ScrollTabsetComponent,
  WizardTopbarComponent,
  WizardToolbarComponent,
  WizardPreviewToolbarComponent,
  WizardSidebarItemComponent,
  WizardSidebarComponent,
  WizardPageContainerComponent,
  WizardStarterComponent,
  WizardComponent,
  DefineEditScheduleModalComponent,
  WizardSummaryPageComponent,
  PreferencesCategoryComponent,
  TimePickerComponent,
  RadioSelectionComponent,
  RadioSelectionDirective,
  BaTableComponent
  // TODO: Add more components.
];

const ECX_SHARED_DIRECTIVES = [
  // TODO: Add more directives.
  OnCollapsableButtonDirective,
  FixMultiselectDropdownPositionDirective,
  DynamicCellDirective
];

const ECX_SHARED_PIPES = [
  MD5Pipe,
  BooleanPipe,
  PagingPipe,
  FileSizePipe,
  FileSizeObservablePipe,
  RpoDisplayPipe,
  StorageSizePipe,
  CommaDelimPipe,
  RoleSecurityGroupNamePipe
  // TODO: Add more pipes.
];

@NgModule({
  declarations: [
    ...ECX_SHARED_PIPES,
    ...ECX_SHARED_DIRECTIVES,
    ...ECX_SHARED_COMPONENTS,
    WorkflowSelectorComponent,
    WizardReviewPageComponent,
    WizardSummaryPageComponent,
    WizardPreviewPageComponent,
    WizardPreviewToolbarComponent,
    ScrollTabsetTabsComponent,
  ],
  imports: [
    CommonModule,
    ModalModule,
    BsDropdownModule.forRoot(),
    NgaModule.forRoot(),
    BsDatepickerModule.forRoot(),
    PopoverModule.forRoot(),
    TreeModule,
    ReactiveFormsModule,
    FormsModule,
    TranslationModule,
    RefreshButtonModule,
    NgxPaginationModule,
    PostScriptsModule,
    // DefineEditScheduleModule,
    LoaderModule,
    MomentModule,
    TooltipModule.forRoot(),
    SdlTooltipModule.forRoot(),
    TabsModule.forRoot(),
    A11yKeyboardModule,
    InfiniteScrollModule,
    NgxMaskModule.forRoot(),
    CdkTableModule
  ],
  exports: [
    ...ECX_SHARED_PIPES,
    ...ECX_SHARED_DIRECTIVES,
    ...ECX_SHARED_COMPONENTS,
    LoaderModule,
    SdlTooltipModule,
    A11yKeyboardModule,
    InfiniteScrollModule
  ],
  entryComponents: [
    WorkflowSelectorComponent,
    WizardReviewPageComponent,
    WizardSummaryPageComponent,
    WizardPreviewPageComponent
  ],
  providers: [
    DecimalPipe,
    PaginatePipe,
    SharedService,
    WebsocketService,
    RouterExtService,
    CredentialService,
    FormQuestionService,
    PreferenceService,
    FileSizePipe
  ]
})
export class SharedModule {
}
