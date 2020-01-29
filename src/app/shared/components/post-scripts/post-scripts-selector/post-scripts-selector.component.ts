import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { JsonConvert } from 'json2typescript';
import { TranslateService } from '@ngx-translate/core';
import { ScriptsModel } from 'scripts/scripts.model';
import { Observable } from 'rxjs/Observable';
import { ScriptModel } from 'scripts/script.model';
import { SorterModel } from '../../../models/sorter.model';
import { RestService } from 'core';
import { SessionService } from 'core';
import { ErrorHandlerComponent } from '../../error-handler/error-handler.component';
import { AlertComponent } from '../../msgbox/alert.component';
import { Subject } from 'rxjs/Subject';
import { AppServerModel } from 'appserver/appserver.model';
import { AppServersModel } from 'appserver/appservers.model';
import { PostScriptsModel } from '../post-scripts.model';
import { FilterModel } from '../../../models/filter.model';
import { PolicyOptionsModel } from '../policy-options.model';
import { ScriptsSelectorComponent } from './scripts-selector-component';

@Component({
  selector: 'post-scripts-selector-component',
  styleUrls: ['./post-scripts-selector.component.scss'],
  templateUrl: './post-scripts-selector.component.html'
})

export class PostScriptsSelectorComponent implements OnInit, OnDestroy {

  @Input() autoLoad: boolean = true;
  @Input() isScriptServerOnly: boolean = false;
  @Input() showInventoryBackupOption: boolean = true;
  @Input() showInventoryTimeoutOption: boolean = false;
  @Input() script: PostScriptsModel;
  @Input() subtype: string;
  @Input() showOptions: boolean = false;

  // template
  private model: PostScriptsModel;
  private postChecked: boolean = true;
  private preChecked: boolean = true;
  private preServerLabel: string = 'server';
  private postServerLabel: string = 'server';
  private scripts: Array<ScriptModel>;
  private scriptServers: Array<AppServerModel>;
  private applicationServers: Array<AppServerModel>;

  // label
  private textScriptServer: string = 'scriptserver';
  private textApplicationServer: string = 'applicationserver';
  private textUseScriptServer: string = 'usescriptserver';
  private textNoServers: string = '';

  // supportive
  private subs: Subject<void> = new Subject<void>();
  private sorters: Array<SorterModel>;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;

  constructor(private translate: TranslateService, private rest: RestService ) {
  }

  // lifecycle

  ngOnInit() {
    this.textNoServers = 'scripts.textScriptServersNoAvail';
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.sorters = [new SorterModel('name', 'ASC'), new SorterModel('lastUpdated', 'DESC')];
    this.model = this.script ? this.script : new PostScriptsModel();
    this.model.policyOption = this.model.policyOption ? this.model.policyOption : new PolicyOptionsModel();
    this.model.setEnableScriptsFlags();
    this.postChecked = this.model.isPostScriptServer;
    this.preChecked = this.model.isPreScriptServer;
    this._initLabels();
    this._setServerLabels();
    if (this.autoLoad) {
      this.getAppservers();
      this.getScripts();
    }
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
    this.subs = undefined;
  }

  // public methods

  public getAppServersUrl(): string {
    return PostScriptsModel.APP_SERVER_URL;
  }

  public getScriptServersUrl(): string {
    return PostScriptsModel.SCRIPT_SERVER_URL;
  }

  public isValid(): boolean {
    return this.model.isValid();
  }

  public getValue(): object {
    return this.model.getPersistentJson();
  }

  public getModel(): PostScriptsModel {
    return this.model;
  }

  public setModel(script: PostScriptsModel, refreshServers: boolean = true): void {
    this.model = script || new PostScriptsModel();
    this.model.setEnableScriptsFlags();
    this.model.playbackScriptSelections(this.scripts);
    this.model.setEnableScriptsFlags();
    this.postChecked = this.model.isPostScriptServer;
    this.preChecked = this.model.isPreScriptServer;
    this._setServerLabels();
    if (refreshServers)
      this.getAppservers();
    else
      this._playbackServerSelection();
  }

  public reset(): void {
    this.model = new PostScriptsModel();
  }

  public getAppservers(): void {
    this._getScriptServers();
    this._getApplicationServers();
  }

  public getScripts(): void {
    let me = this, observable: Observable<ScriptsModel>;
    observable = ScriptsModel.retrieve<ScriptModel, ScriptsModel>(ScriptsModel,
      me.rest, [], me.sorters, 0);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.scripts = dataset.getRecords();
            me.model.playbackScriptSelections(me.scripts);
          }
        },
        err => {
          me.handleError(err);
        }
      );
    }
  }

  // template methods

  handlePreTypeChange(): void {
    this.preChecked = !this.preChecked;
    this._setServerLabels();
    this.model.preGuestAppserver =
      (this.preChecked) ? this.scriptServers[0] : this.applicationServers[0];
  }

  handlePostTypeChange(): void {
    this.postChecked = !this.postChecked;
    this._setServerLabels();
    this.model.postGuestAppserver =
      (this.postChecked) ? this.scriptServers[0] : this.applicationServers[0];
  }

  onPreScriptSelection(value: ScriptModel) {
    this.model.preGuestScript = value;
  }

  onPreServerSelection(value: AppServerModel) {
    this.model.preGuestAppserver = value;
  }

  onPostScriptSelection(value: ScriptModel) {
    this.model.postGuestScript = value;
  }

  onPostServerSelection(value: AppServerModel) {
    this.model.postGuestAppserver = value;
  }

  // privates

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private _playbackServerSelection(): void {
    this.model.playbackPostAppserverSelections((this.postChecked) ?
        this.scriptServers : this.applicationServers);
    this.model.playbackPreAppserverSelections((this.preChecked) ?
        this.scriptServers : this.applicationServers);
  }

  private _getServers(url: string, filters?: Array<FilterModel>): Observable<AppServersModel> {
    let sorters: SorterModel = new SorterModel('name', 'ASC');
    return this.rest.getAll(url,
      filters, [sorters], 50, 0).map(
      (response: Object) => {
        let data = response,
          dataset = JsonConvert.deserializeObject(data, AppServersModel);
        return dataset;
      }
    ).catch((error: Response) => Observable.throw(error));
  }

  private _initLabels(): void {
    let observable: Observable<any>;
    observable = this.translate.get([
      'scripts.textScriptServer',
      'scripts.textUseScriptServer',
      'application.textApplicationServer'
    ]);

    if (observable) {
      observable.takeUntil(this.subs).subscribe(
        resource => {
          this.textScriptServer = resource['scripts.textScriptServer'];
          this.textApplicationServer = resource['application.textApplicationServer'];
          this.textUseScriptServer = resource['scripts.textUseScriptServer'];
        }
      );
    }
  }

  private _getScriptServers(filters?: Array<FilterModel>): void {
    let me = this, observable: Observable<AppServersModel>;
    observable = this._getServers(me.getScriptServersUrl(), filters);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.scriptServers = dataset.getRecords();
            me._playbackServerSelection();
          }
        }
      );
    }
  }

  private _getApplicationServers(filters?: Array<FilterModel>): void {
    let me = this, observable: Observable<AppServersModel>;
    observable = this._getServers(me.getAppServersUrl(), filters);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          if (dataset) {
            me.applicationServers = dataset.getRecords();
            me._playbackServerSelection();
          }
        }
      );
    }
  }

  private _setServerLabels(): void {
    this.postServerLabel =
      (this.postChecked === true) ? this.textScriptServer : this.textApplicationServer;
    this.preServerLabel =
      (this.preChecked === true) ? this.textScriptServer : this.textApplicationServer;

    return;
  }
}
