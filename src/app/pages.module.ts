import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from 'ngx-bootstrap';
import { routing } from './pages.routing';
import { NgaModule } from 'theme/nga.module';
import { SharedModule, TranslationModule } from 'shared';
import { LoginModule } from './login/login.module';
import { WhatsNewModule } from './whatsnew/whatsnew.module';
import { LogoutModule } from './logout/logout.module';
import { Pages } from './pages.component';
import { RestService, NodeService, HelpService } from 'core';
import { LoginService } from './login/login.service';
import { LogoutService } from './logout/logout.service';
import { AuthGuard } from './login/auth-guard.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LicenseService } from './license/license.service';
import { QuickStartModule } from './quickstart/quickstart.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DummyService } from './dummy/dummy.service';
import { LoaderModule } from 'shared/components/loader/loader.module';

@NgModule({

  imports: [
    CommonModule,
    NgaModule,
    ModalModule.forRoot(),
    QuickStartModule,
    FeedbackModule,
    SharedModule,
    TranslationModule,
    ReactiveFormsModule,
    FormsModule,
    LoginModule,
    LogoutModule,
    WhatsNewModule,
    routing,
    LoaderModule],
  declarations: [Pages],
  providers: [
    DummyService,
    RestService,
    NodeService,
    HelpService,
    LicenseService,
    AuthGuard,
    LoginService,
    LogoutService
  ]
})
export class PagesModule {
}
