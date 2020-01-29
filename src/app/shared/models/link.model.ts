import {JsonObject, JsonProperty} from 'json2typescript';

@JsonObject
export class LinkModel {

  public name: string = undefined;

  @JsonProperty('rel', String)
  public rel: string = undefined;

  @JsonProperty('href', String)
  public href: string = undefined;

  @JsonProperty('title', String, true)
  public title: string = undefined;

  @JsonProperty('schema', undefined, true)
  public schema: any = undefined;

  equals(link: LinkModel): boolean {
    return this.name === link.name && this.rel === link.rel && this.href === link.href && this.title === link.title &&
      this.schema === link.schema;
  }
}
