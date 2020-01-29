import 'rxjs/Rx';
import { JsonConvert, JsonObject, JsonProperty } from 'json2typescript';
import { PostScriptsModel } from 'shared/components/post-scripts/post-scripts.model';
import { HasPersistentJson } from 'core';
import { SiteModel } from 'site/site.model';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class SubpolicyModel implements HasPersistentJson {
  @JsonProperty('type', String, true)
  public type: string = 'restore';

  @JsonProperty('mode', String, true)
  public mode: string = 'test';

  @JsonProperty('option', Object, true)
  public option: object = {};

  @JsonProperty('destination', Object, true)
  public destination: object = {};

  @JsonProperty('source', Object, true)
  public source: object = {};

  public selectedSite: BaseModel;

  public isOffload: boolean = false;

  public offloadType: string = '';

  public getPersistentJson(readOnly?: boolean): object {
    let returnVal: object =  {
      type: this.type,
      mode: this.mode,
      destination: this.destination,
      option: this.option,
      source: {}
    };
    if (readOnly) {
      returnVal['source'] = this.source;
      return returnVal;
    }

    if (this.isOffload) {
      returnVal['source'] = {
        copy: {
          offload: {
            href: this.selectedSite.url,
            type: this.offloadType
          }
        }
      };
    } else if (this.selectedSite && this.selectedSite.url) {
      returnVal['source'] = {
        copy: {
          site: {
            href: this.selectedSite.url
          },
        }
      };
    } else {
      returnVal['source'] = null;
    }
    return returnVal;
  }
}

@JsonObject
export class SourceModel implements HasPersistentJson {
  @JsonProperty('href', String, true)
  public href: string = '';

  @JsonProperty('resourceType', String, true)
  public resourceType: string = '';

  @JsonProperty('include', Boolean, true)
  public include: boolean = true;

  @JsonProperty('version', Object, true)
  public version: object = {};

  @JsonProperty('metadata', Object, true)
  public metadata: object = {};

  @JsonProperty('id', String, true)
  public id: string = '';

  @JsonProperty('pointInTime', Number, true)
  public pointInTime: number = 0;

  @JsonProperty('transactionId', String, true)
  public transactionId: string = '';


  public getPersistentJson(): object {
    let sourcePayload: object = {
      href: this.href,
      resourceType: this.resourceType,
      include: true,
      version: this.version,
      metadata: this.metadata,
      id: this.id
    };
    if (this.pointInTime || this.transactionId) {
      sourcePayload['pointInTime'] = this.pointInTime;
      sourcePayload['transactionId'] = this.transactionId;
      sourcePayload['version'] = null;
    }
    return sourcePayload;
  }
}

@JsonObject
export class SpecModel implements HasPersistentJson {
  @JsonProperty('source', [SourceModel], true)
  public source: Array<SourceModel> = [];

  @JsonProperty('subpolicy', [SubpolicyModel], true)
  public subpolicy: Array<SubpolicyModel> = [new SubpolicyModel()];

  @JsonProperty('view', String, true)
  public view: string = '';

  public getPersistentJson(readOnly?: boolean): object {
    return {
      source: this.getSourcePayload(),
      subpolicy: this.subpolicy.length > 0 ? [this.subpolicy[0].getPersistentJson(readOnly)] : [],
      view: this.view
    };
  }

  private getSourcePayload(): Array<any> {
    let sourceArr: Array<any> = [];
    this.source.forEach((source: SourceModel) => {
      sourceArr.push(source.getPersistentJson());
    });
    return sourceArr;
  }
}

@JsonObject
export class NodeRestorePolicyModel implements HasPersistentJson {
  @JsonProperty('subType', String, true)
  public subType: string = '';

  @JsonProperty('name', String, true)
  public name: string = undefined;

  @JsonProperty('script', PostScriptsModel, true)
  public script: PostScriptsModel  = undefined;

  @JsonProperty('spec', SpecModel, true)
  public spec: SpecModel = new SpecModel();

  @JsonProperty('trigger', Object, true)
  public trigger: object = undefined;

  public set siteModel(site: BaseModel) {
    if (this.spec && this.spec.subpolicy && this.spec.subpolicy[0]) {
      this.spec.subpolicy[0].selectedSite = site;
    }
  }

  public set offload(isOffload: boolean) {
    if (this.spec && this.spec.subpolicy && this.spec.subpolicy[0]) {
      this.spec.subpolicy[0].isOffload = isOffload;
    }
  }

  public set offloadType(offloadType: string) {
    if (this.spec && this.spec.subpolicy && this.spec.subpolicy[0]) {
      this.spec.subpolicy[0].offloadType = offloadType;
    }
  }

  public getPersistentJson(readOnly?: boolean): object {
    let returnVal: object = {
      subType: this.subType,
      script: this.script ? (readOnly ? this.script.json() : this.script.getPersistentJson()) : {},
      spec: this.spec.getPersistentJson(readOnly)
    };
    if (this.name) {
      returnVal['name'] = this.name;
    }
    if (this.trigger) {
      returnVal['trigger'] = this.trigger;
    }
    return returnVal;
  }
}
