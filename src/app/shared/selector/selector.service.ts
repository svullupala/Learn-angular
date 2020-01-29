import {Injectable} from '@angular/core';

@Injectable()
export abstract class SelectorService<T> {

  public abstract select(records: T | T[]): void;

  public abstract deselect(records: T | T[], exclusionSupported?: boolean): void;

  public abstract deselectAll(): void;

  public abstract isSelected(record: T): boolean;

  public abstract hasPartialSelection(record: T): boolean;

  public abstract getPath(record: T): string;

  public abstract setPath(record: T, path: string): void;

  public abstract count(): number;

  public abstract selection(): T[];
}
