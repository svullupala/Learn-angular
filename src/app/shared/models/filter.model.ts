export class FilterModel {

  static array2json(filters: Array<FilterModel>): Array<Object> {
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
              public value: any,
              public op: string = '=') {
  }

  json(): Object {
    return {
      property: this.property,
      value: this.value,
      op: this.op
    };
  }
}
