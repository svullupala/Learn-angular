export class SorterModel {

  static array2json(filters: Array<SorterModel>): Array<Object> {
    let target: Array<Object>;
    if (filters && filters.length > 0) {
      target = [];
      filters.forEach(function (item) {
        target.push(item.json());
      });
    }
    return target;
  }

  constructor(public property: string,
              public direction: string = 'ASC',
              public displayName?: string) {
  }

  json(): Object {
    return {
      property: this.property,
      direction: this.direction
    };
  }
}
