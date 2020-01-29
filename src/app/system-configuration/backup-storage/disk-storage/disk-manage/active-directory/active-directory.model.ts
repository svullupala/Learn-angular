import { JsonObject, JsonProperty } from 'json2typescript';

@JsonObject
export class JoinActiveDirectoryModel {

  public domain: string = undefined;
  public username: string = undefined;
  public password: string = undefined;

  public constructor(init?: Partial<JoinActiveDirectoryModel>) {
    Object.assign(this, init);
  }

}

@JsonObject
export class LeaveActiveDirectoryModel {

  public username: string = undefined;
  public password: string = undefined;

  public constructor(init?: Partial<LeaveActiveDirectoryModel>) {
    Object.assign(this, init);
  }

}
