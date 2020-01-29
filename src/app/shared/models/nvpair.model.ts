export class NvPairModel {

  static find(pairs: NvPairModel[], value: any): NvPairModel {
    return pairs.find(function (item) {
      return item.value === value;
    });
  }

  static setName(pairs: NvPairModel[], value: any, name: string): void {
    let target = NvPairModel.find(pairs, value);
    if (target)
      target.name = name;
  }

  constructor(public name: string,
              public value: any) {
  }
}
