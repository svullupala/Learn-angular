export type WeeklyScheduleCell = {
  min: number,
  max: number
};

export type WeeklyScheduleEntryPlain = {
  start: number;
  end: number;
};

export class WeeklyScheduleEntry {
  start: number;
  end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  json(): WeeklyScheduleEntryPlain {
    return {
      start: this.start,
      end: this.end
    };
  }

  fromJson(json: WeeklyScheduleEntryPlain): WeeklyScheduleEntry {
    this.start = json.start;
    this.end = json.end;
    return this;
  }

  isValid(): boolean {
    return this.start >= 0 && this.end > this.start;
  }

  matchCell(cell: WeeklyScheduleCell): boolean {
    return cell.min >= this.start && cell.max <= this.end;
  }
}

export class WeeklyScheduleModel {

  protected entries: WeeklyScheduleEntry[] = [];

  private static snake(entries: WeeklyScheduleEntry[]): void {
    let snaking = false, len = entries ? entries.length : 0;
    if (len > 1) {
      for (let i = 0; i < entries.length; i++) {
        let entry: WeeklyScheduleEntry, next: WeeklyScheduleEntry;
        if (i < len - 1) {
          entry = entries[i];
          next = entries[i + 1];
          if (entry.end + 1 === next.start) {
            entries.splice(i, 2, new WeeklyScheduleEntry(entry.start, next.end));
            snaking = true;
            break;
          }
        }
      }
      if (snaking)
        WeeklyScheduleModel.snake(entries);
    }
  }

  constructor(entries?: WeeklyScheduleEntry[]) {
    this.entries = entries || [];
  }

  protected addEntry(entry: WeeklyScheduleEntry): number {
    let me = this, len = me.entries ? me.entries.length : 0;
    if (entry.isValid()) {
      me.entries = me.entries || [];
      len = me.entries.push(entry);
    }
    return len;
  }

  protected sortEntries(): void {
    (this.entries || []).sort(function (a, b) {
      return a.start - b.start;
    });
  }

  protected optimize(): void {
    let me = this;
    if (me.entries) {
      me.sortEntries();
      WeeklyScheduleModel.snake(me.entries);
    }
  }

  getEntries(): WeeklyScheduleEntry[] {
    return this.entries;
  }

  json(): WeeklyScheduleEntryPlain[] {
    let me = this, result = [];
    if (me.entries) {
      me.entries.forEach(function (entry) {
        result.push(entry.json());
      });
    }
    return result;
  }

  fromJson(json: WeeklyScheduleEntryPlain[]): WeeklyScheduleModel {
    let me = this, entries: WeeklyScheduleEntry[] = [];
    if (json) {
      json.forEach(function (entry) {
        entries.push(new WeeklyScheduleEntry(entry.start, entry.end));
      });
    }
    me.entries = entries;
    return me;
  }

  findMatchingEntry(cell: WeeklyScheduleCell): WeeklyScheduleEntry {
    let me = this, target, index = me.findMatchingEntryIndex(cell);
    if (index !== -1) {
      target = me.entries[index];
    }
    return target;
  }

  findMatchingEntryIndex(cell: WeeklyScheduleCell): number {
    return (this.entries || []).findIndex(function (entry) {
      return entry.matchCell(cell);
    });
  }

  isCellMatching(cell: WeeklyScheduleCell): boolean {
    return this.findMatchingEntryIndex(cell) !== -1;
  }

  removeCell(cell: WeeklyScheduleCell): void {
    let me = this, newEntry: WeeklyScheduleEntry, index, entry = me.findMatchingEntry(cell);
    if (entry) {
      index = me.findMatchingEntryIndex(cell);
      me.entries.splice(index, 1);

      newEntry = new WeeklyScheduleEntry(entry.start, cell.min - 1);

      me.addEntry(newEntry);

      newEntry = new WeeklyScheduleEntry(cell.max + 1, entry.end);

      me.addEntry(newEntry);

      me.optimize();
    }
  }

  addCell(cell: WeeklyScheduleCell): void {
    let me = this, newEntry: WeeklyScheduleEntry, entry = me.findMatchingEntry(cell);
    if (!entry) {
      newEntry = new WeeklyScheduleEntry(cell.min, cell.max);
      me.addEntry(newEntry);
      me.optimize();
    }
  }
}
