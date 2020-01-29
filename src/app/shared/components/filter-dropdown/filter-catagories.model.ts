import { FilterModel } from 'shared/models/filter.model';
import { HasPersistentJson } from 'core';

export class FilterCatagoriesModel {
  public header: string;
  public catagories: Array<FilterCatagoryModel>;
  public hidden: boolean;

  constructor(header: string, catagories: Array<FilterCatagoryModel>, hidden?: boolean) {
    this.header = header;
    this.catagories = catagories;
    this.hidden = hidden || false;
  }

  public hasCatagories(): boolean {
    return Array.isArray(this.catagories) && this.catagories.length > 0;
  }
}

export class FilterCatagoryModel implements HasPersistentJson{
  public name: string;
  public selected: boolean = false;
  public filter: FilterModel;
  public property: string;
  public value: string;
  public op: string;
  public metadata: object = {};
  private id: string;

  constructor(name: string, selected: boolean, property: string, value: string, op?: string) {
    this.name = name;
    this.selected = selected;
    this.property = property;
    this.value = value;
    this.op = op || '=';
    this.filter = new FilterModel(this.property, this.value, this.op);
    this.id = String(Math.floor(Math.random() * 1000000000));
  }

  public getPersistentJson(): Object {
    return this.filter.json();
  }

  public getFilterModel(): FilterModel {
    return this.filter;
  }

  public getId(): string {
    return this.id;
  }

  /**
   * @Overrride
   * Returns true if the given model equals this model.
   * @param another The given model
   * @returns {boolean}
   */
  public equals(another: FilterCatagoryModel): boolean {
    return this.identity(another.getId());
  }

  /**
   * @Overrride
   * Returns true if the given id matches this model.
   *
   * @param {string} id
   * @returns {boolean}
   */
  public identity(id: string): boolean {
    return this.id === id;
  }
}
