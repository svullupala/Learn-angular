import { JsonObject, JsonProperty } from 'json2typescript';
import { AppServerModel } from 'appserver/appserver.model';
import { ScriptModel } from 'scripts/script.model';
import { AppScriptModel } from './app-script.model';
import { PolicyOptionsModel } from './policy-options.model';

@JsonObject
export class PostScriptsModel {

  public static SCRIPT_SERVER_URL: string = 'api/scriptserver';
  public static APP_SERVER_URL: string = 'api/appserver';


  @JsonProperty('preGuest', AppScriptModel, true)
  public preGuest: AppScriptModel = null;

  @JsonProperty('postGuest', AppScriptModel, true)
  public postGuest: AppScriptModel = null;

  @JsonProperty('continueScriptsOnError', Boolean, true)
  public continueScriptsOnError: boolean = false;

  @JsonProperty('policyOption', PolicyOptionsModel, true)
  public policyOption: PolicyOptionsModel = new PolicyOptionsModel();

  public preGuestAppserver: AppServerModel;
  public preGuestScript: ScriptModel;
  public postGuestAppserver: AppServerModel;
  public postGuestScript: ScriptModel;
  public enablePreGuest: boolean = false;
  public enablePostGuest: boolean = false;
  public isPostScriptServer: boolean = false;
  public isPreScriptServer: boolean  = false;

  public isValid(): boolean {
    let valid: boolean = true;
    if (this.enablePostGuest && this.enablePreGuest) {
      valid =  !!(this.postGuestAppserver && this.postGuestScript && this.preGuestAppserver && this.preGuestScript);
    } else if (this.enablePreGuest) {
      valid =  !!(this.preGuestAppserver && this.preGuestScript);
    } else if (this.enablePostGuest) {
      valid =  !!(this.postGuestAppserver && this.postGuestScript);
    }

    if (!this.policyOption.isValid()) {
      return false;
    }

    return valid;
  }

  public syncPrePostGuest(): void {
    this.preGuest = this.preGuest === null ? new AppScriptModel() : this.preGuest;
    this.postGuest = this.postGuest === null ? new AppScriptModel() : this.postGuest;
    this.preGuest.appserver = this.preGuestAppserver  ? this.preGuestAppserver.getAppserverHrefName() : undefined;
    this.postGuest.appserver = this.postGuestAppserver ? this.postGuestAppserver.getAppserverHrefName() : undefined;
    this.preGuest.script = this.preGuestScript ? this.preGuestScript.getScriptHrefArgsMeta() : undefined;
    this.postGuest.script = this.postGuestScript ? this.postGuestScript.getScriptHrefArgsMeta() : undefined;
  }

  public getPersistentJson(includeOptions: boolean = false): object {
    this.syncPrePostGuest();

    if (includeOptions){
      return {
        script: {
          preGuest: this.enablePreGuest ? this.preGuest.getPersistentJson() : null,
          postGuest: this.enablePostGuest ?  this.postGuest.getPersistentJson() : null,
          continueScriptsOnError: this.continueScriptsOnError
        },
        policyOption: includeOptions ? this.policyOption.getPersistentJson() : undefined
      };
    } else {
      return {
        preGuest: this.enablePreGuest ? this.preGuest.getPersistentJson() : null,
        postGuest: this.enablePostGuest ? this.postGuest.getPersistentJson() : null,
        continueScriptsOnError: this.continueScriptsOnError
      };
    }
  }

  public json(includeOptions: boolean = false): object {
    if (includeOptions){
      return {
        script: {
          preGuest: this.preGuest ? this.preGuest.getPersistentJson() : null,
          postGuest: this.postGuest ?  this.postGuest.getPersistentJson() : null,
          continueScriptsOnError: this.continueScriptsOnError
        },
        policyOption: includeOptions ? this.policyOption.getPersistentJson() : undefined
      };
    } else {
      return {
        preGuest: this.preGuest ? this.preGuest.getPersistentJson() : null,
        postGuest: this.postGuest ? this.postGuest.getPersistentJson() : null,
        continueScriptsOnError: this.continueScriptsOnError
      };
    }
  }

  public playbackScriptSelections(scripts: Array<ScriptModel>): void {
    let preguestConfigured: boolean = this.isPreguestConfigured,
        postguestConfigured: boolean = this.isPostguestConfigured;
    if (preguestConfigured || postguestConfigured) {
      if (scripts && scripts.length > 0) {
        for (let i = 0; i < scripts.length; i++) {
          if (postguestConfigured && this.postGuest.script
            && this.postGuest.script.href === scripts[i].url) {
            this.postGuestScript = scripts[i];
          }
          if (preguestConfigured && this.preGuest.script
            && this.preGuest.script.href === scripts[i].url) {
            this.preGuestScript = scripts[i];
          }
          if (this.breakIterationIfSelectionFound(preguestConfigured, postguestConfigured,
              this.preGuestScript, this.postGuestScript)) {
            break;
          }
        }
      }
    }
  }
  public playbackPostAppserverSelections(appservers: Array<AppServerModel>): void {
    let postguestConfigured: boolean = this.isPostguestConfigured;

    if (postguestConfigured) {
      if (appservers && appservers.length > 0) {
        for (let i = 0; i < appservers.length; i++) {
          if (this.postGuest.appserver && this.postGuest.appserver.href === appservers[i].url) {
            this.postGuestAppserver = appservers[i];
            return;
          }
        }
      }
    }
  }

  public playbackPreAppserverSelections(appservers: Array<AppServerModel>): void {
    let preguestConfigured: boolean = this.isPreguestConfigured;

    if (preguestConfigured) {
      if (appservers && appservers.length > 0) {
        for (let i = 0; i < appservers.length; i++) {
          if (this.preGuest.appserver && this.preGuest.appserver.href === appservers[i].url) {
            this.preGuestAppserver = appservers[i];
            return;
          }
        }
      }
    }
  }

  public setEnableScriptsFlags(): void {
    this.enablePostGuest = this.isPostguestConfigured;
    this.enablePreGuest = this.isPreguestConfigured;
    this.isPostScriptServer = this.isPostguestScriptServer();
    this.isPreScriptServer = this.isPreguestScriptServer();
  }

  public get isPreguestConfigured(): boolean {
    if (this.preGuest) {
      return this.preGuest.appserver != null;
    }
    return this.preGuest != null;
  }

  public get isPostguestConfigured(): boolean {
    if (this.postGuest) {
      return this.postGuest.appserver != null;
    }
    return this.postGuest != null;
  }

  public isPreguestScriptServer(): boolean {
    if (this.isPreguestConfigured) {
      if (!this.appserverHrefReady(this.preGuest))
        return false;
      return this.preGuest.appserver.href.includes(PostScriptsModel.SCRIPT_SERVER_URL);
    }

    return true;
  }

  public isPostguestScriptServer(): boolean {
    if (this.isPostguestConfigured) {
      if (!this.appserverHrefReady(this.postGuest))
        return false;
      return this.postGuest.appserver.href.includes(PostScriptsModel.SCRIPT_SERVER_URL);
    }

    return true;
  }

  public get isOptionsConfigured(): boolean {
    if (this.policyOption)
      return this.policyOption.excluderesources !== '' || this.policyOption.forcebaseresources !== '' || this.policyOption.runInventory === true;
    return false;
  }

  private appserverHrefReady(script: AppScriptModel): boolean {
    return !!(script && script.appserver && script.appserver.href);
  }

  private breakIterationIfSelectionFound(preguestConfigured: boolean, postguestConfigured,
                                     preGuest: ScriptModel | AppServerModel,
                                     postGuest: ScriptModel | AppServerModel): boolean {
    if (preguestConfigured && postguestConfigured && preGuest && postGuest) {
      return true;
    } else if (postguestConfigured && !preguestConfigured && postGuest) {
      return true;
    } else if (preguestConfigured && !postguestConfigured && preGuest) {
      return true;
    }
    return false;
  }
}
