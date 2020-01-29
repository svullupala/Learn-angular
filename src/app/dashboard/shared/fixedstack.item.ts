export class FixedStack {
  private contents: StackItem[] = [];

  constructor() { }

  public push(value: StackItem) {
    let index = this.exists(value);
    if (index !== undefined) {
      this.contents[index] = value;
    } else {
      this.contents.push(value);
    }
  }

  public pushSum(value: StackItem) {
    let index = this.exists(value);
    if (index !== undefined) {
      let existing = this.contents[index];
      existing.value += value.value;
      this.contents[index] = existing;
    } else {
      this.contents.push(value);
    }
  }

  public pushItem(label: string, value: number) {
    this.push(new StackItem(label, value));
  }

  public getLength(): number {
    return this.contents.length;
  }

  public getContents(): StackItem[] {
    this.sort(this.contents);
    return this.contents;
  }

  public getLengthContents(length: number, otherLabel: string, preventSort?: boolean): StackItem[] {
    if (!preventSort)
      this.sort(this.contents);
    let retVal: StackItem[] = this.contents.slice(0, length);
    let theRest: StackItem[] = this.contents.slice(length);
    let count: number = 0;

    for (let i = 0; i < theRest.length; i++) {
      count += theRest[i].value;
    }

    if (count > 0 && !!otherLabel) {
      retVal.push(new StackItem(otherLabel, count));
    }
    if (!preventSort)
      this.sort(retVal);
    return retVal;
  }

  private sort(values: StackItem[]) {
    values.sort((n1: StackItem, n2: StackItem) => {
      if (n1.value === n2.value) {
        return 0;
      } else if (n1.value > n2.value)  {
        return -1;
      } else {
        return 1;
      }
    });
  }

  private exists(value: StackItem): number {
    for (let i = 0; i < this.contents.length; i++) {
      if (this.contents[i].label === value.label) {
        return i;
      }
    }

    return undefined;
  }
}

export class StackItem {
  constructor(public label: string, public value: number) { }
}
