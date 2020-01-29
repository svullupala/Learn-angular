import { JsonObject, JsonProperty } from 'json2typescript/index';
import { BaseModel } from 'shared/models/base.model';
import { HasPersistentJson } from 'core';

@JsonObject
export class BucketModel extends BaseModel implements HasPersistentJson {

  public getPersistentJson(): object {
    return {
      properties: {
        bucket: this.name,
        archiveBucket: this.name
      }
    };
  }
}
