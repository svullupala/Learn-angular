import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseModel} from 'shared/models/base.model';
import {HrefArgsMetadataModel} from 'shared/components/post-scripts/href-args-metadata.model';

@JsonObject
export class ScriptModel extends BaseModel {

  public static TYPE_SHELL: string = 'shell';

  @JsonProperty('type', String, true)
  public type: string = ScriptModel.TYPE_SHELL;

  @JsonProperty('lastUpdated', Number, true)
  public lastUpdated: number = 0;

  @JsonProperty('comment', String, true)
  public comment: string = undefined;

  public getPersistentJson(): Object {
    return {
      name: this.name,
      type: this.type,
      comment: this.comment
    };
  }

  public getUpdateJson(): Object {
    return this.getPersistentJson();
  }

  public getScriptHrefArgsMeta(): HrefArgsMetadataModel {
    let model: HrefArgsMetadataModel = new HrefArgsMetadataModel();
    model.href = this.getUrl('self');
    model.metadata['name'] = this.name;
    return model;
  }
}
