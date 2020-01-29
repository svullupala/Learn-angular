import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from 'theme/nga.module';
import { MomentModule } from 'angular2-moment';
import { NgUploaderModule } from 'ngx-uploader';
import { LoaderModule } from 'shared/components/loader/loader.module';
import { TranslationModule, SharedModule } from 'shared';
import { GlobalPreferencesComponent } from "./global-preferences.component";
import { GlobalPreferencesService } from "./global-preferences.service";


@NgModule({
    imports: [
        NgUploaderModule,
        NgaModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        TranslationModule,
        LoaderModule,
        MomentModule,
        SharedModule
    ],
    declarations: [
        GlobalPreferencesComponent,
    ],
    providers: [
        GlobalPreferencesService,
    ],
    exports: [

    ]
})
export class GlobalPreferencesModule {
}
