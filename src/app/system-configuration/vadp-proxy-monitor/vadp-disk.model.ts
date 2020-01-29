import { JsonObject, JsonProperty } from 'json2typescript/index';

@JsonObject
export class VadpDiskModel {

  @JsonProperty('changedBytes', Number, true)
  public changedBytes: number = 0;

  @JsonProperty('totalBytes', Number, true)
  public totalBytes: number = 0;

  @JsonProperty('sourcePath', String, true)
  public sourcePath: string = '';

  @JsonProperty('snapshotPath', String, true)
  public snapshotPath: string = '';

  @JsonProperty('label', String, true)
  public label: string = '';
}
