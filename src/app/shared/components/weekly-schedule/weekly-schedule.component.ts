import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges,
  ViewChild
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  WeeklyScheduleCell, WeeklyScheduleEntry, WeeklyScheduleEntryPlain,
  WeeklyScheduleModel
} from 'shared/components/weekly-schedule/weekly-schedule.model';
import { SharedService } from 'shared/shared.service';

type WeeklyScheduleIconTick = {
  x: number;
  icon: string;
};

type WeeklyScheduleContext = {
  xMin: number;
  xMax: number;
  segmentNum: number;
  operableAreaWidth: number;
  legendsAreaWidth: number;
};

type WeeklyScheduleDayValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type WeeklyScheduleDay = {
  day: WeeklyScheduleDayValue;
  title: string;
  cells: WeeklyScheduleCell[];
  model: WeeklyScheduleEntry[];
};

type WeeklySchedule = WeeklyScheduleDay[];
type WeeklyScheduleSummaryEntry = {
  day: WeeklyScheduleDayValue;
  startDay: string;
  endDay?: string;
  times: {
    start: string;
    end: string;
  }[];
};

type WeeklyScheduleSummary = WeeklyScheduleSummaryEntry[];
type WeeklyScheduleDayCellsPair = { day: WeeklyScheduleDay, cells: WeeklyScheduleCell[] };

@Component({
  selector: 'weekly-schedule',
  styleUrls: ['./weekly-schedule.component.scss'],
  templateUrl: './weekly-schedule.component.html',
})
export class WeeklyScheduleComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  @Input() model: WeeklyScheduleModel;

  @Input() hideSummary: boolean = false;

  @ViewChild('canvas') canvas: ElementRef;

  private schedule: WeeklySchedule = [];

  private ctx: WeeklyScheduleContext = {
    xMin: 0, xMax: 0, segmentNum: 24, operableAreaWidth: 120, legendsAreaWidth: 120
  };
  private iconTicks: WeeklyScheduleIconTick[] =
    [{ x: 0, icon: 'ion-ios-moon' }, { x: 12, icon: 'ion-ios-sunny-outline' }, { x: 24, icon: 'ion-ios-moon' }];
  private daySeconds: number = 24 * 60 * 60;
  private xAxisTicks: number[] = [];
  private cellCols: number[] = [];
  private resizeTimer: any;
  private oldWidth: number = 0;
  private oldHeight: number = 0;
  private cerulean50 = '#047CC0';
  private textSummaryDayRangeTpl: string;
  private textSummaryTimeRangeTpl: string;
  private textSunday: string;
  private textMonday: string;
  private textTuesday: string;
  private textWednesday: string;
  private textThursday: string;
  private textFriday: string;
  private textSaturday: string;
  private textHours: string;

  /**
   * Returns summary, e.g. 'Monday through Friday from 5:00 AM to 9:59 PM'.
   *
   * @returns {string}
   */
  get summary(): string {
    let me = this, summary = me.getSummary(), result = '';
    summary.forEach(function (item, idx) {
      if (idx > 0)
        result += '; ';

      result += (item.endDay ? SharedService.formatString(me.textSummaryDayRangeTpl || '',
        item.startDay, item.endDay) : item.startDay) + ' ';

      item.times.forEach(function (time, index) {
        if (index > 0)
          result += ', ';
        result += SharedService.formatString(me.textSummaryTimeRangeTpl || '',
          time.start, time.end);
      });
    });
    return result;
  }

  constructor(private translate: TranslateService) {

    for (let i = 0; i < this.ctx.segmentNum + 1; i++) {
      this.xAxisTicks.push(i);
      if (i < this.ctx.segmentNum)
        this.cellCols.push(i);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    if (changes && changes['model'] && !changes['model'].isFirstChange()) {
      me.resetScheduleModel();
    }
  }

  ngOnInit() {
    let me = this;

    if (!me.model)
      me.model = new WeeklyScheduleModel();

    me.translate.get([
      'common.textWeeklyScheduleSummaryDayRangeTpl',
      'common.textWeeklyScheduleSummaryTimeRangeTpl',
      'common.textHours',
      'slapolicy.textSunday',
      'slapolicy.textMonday',
      'slapolicy.textTuesday',
      'slapolicy.textWednesday',
      'slapolicy.textThursday',
      'slapolicy.textFriday',
      'slapolicy.textSaturday'])
      .subscribe((resource: Object) => {

        me.textSummaryDayRangeTpl = resource['common.textWeeklyScheduleSummaryDayRangeTpl'];
        me.textSummaryTimeRangeTpl = resource['common.textWeeklyScheduleSummaryTimeRangeTpl'];
        me.textSunday = resource['slapolicy.textSunday'];
        me.textMonday = resource['slapolicy.textMonday'];
        me.textTuesday = resource['slapolicy.textTuesday'];
        me.textWednesday = resource['slapolicy.textWednesday'];
        me.textThursday = resource['slapolicy.textThursday'];
        me.textFriday = resource['slapolicy.textFriday'];
        me.textSaturday = resource['slapolicy.textSaturday'];
        me.textHours = resource['common.textHours'];

        me.initSchedule();
      });
  }

  ngAfterViewInit(): void {
    this.bindResize();
  }

  ngOnDestroy(): void {
    this.unbindResize();
  }

  iconAxisStyle(): {} {
    let me = this, xMax = me.ctx.xMax || 0, segmentNum = me.ctx.segmentNum || 1,
      width = xMax + xMax / segmentNum,
      marginLeft = me.ctx.operableAreaWidth;
    return {
      'width': width + 'px',
      'margin-left': marginLeft + 'px'
    };
  }

  iconTickStyle(tick: WeeklyScheduleIconTick): {} {
    let me = this, tsWidth = me.ctx.segmentNum,
      marginLeft = 0, offset = 0,
      tsStat = tick.x,
      xWidth = me.ctx.xMax - me.ctx.xMin;
    if (tsWidth) {
      offset = tsStat * xWidth / tsWidth;
    }
    marginLeft = offset - 16;
    return {
      'margin-left': me.reviseOffset(marginLeft, tick.x, 2) + 'px'
    };
  }

  xAxisStyle(): {} {
    let me = this, xMax = me.ctx.xMax || 0, segmentNum = me.ctx.segmentNum || 1,
      offset = xMax * 0.5 / segmentNum, width = xMax + xMax / segmentNum,
      marginLeft = me.ctx.operableAreaWidth - offset;
    return {
      'width': width + 'px',
      'margin-left': marginLeft + 'px'
    };
  }

  xAxisTickLabelStyle(tick: number): {} {
    let me = this;
    return {
      'margin-left': me.reviseOffset(0, tick, 5) + 'px'
    };
  }

  xTickFormat(data): string {
    let me = this, canvasWidth = me.ctx.xMax + me.ctx.operableAreaWidth;
    if (canvasWidth < 350 && data % 4 || canvasWidth < 530 && data % 2)
      return '.';
    return '' + data;
  }

  xTickTitle(data): string {
    return '' + data;
  }

  cellStyle(cell: WeeklyScheduleCell): {} {
    return {
      'background-color': this.model.isCellMatching(cell) ? this.cerulean50 : 'white'
    };
  }

  onAllClick(): void {
    let me = this, model = me.model, matching = me.isScheduleMatching(me.schedule);
    (me.schedule || []).forEach(function (day) {
      (day.cells || []).forEach(function (cell) {
        if (matching)
          model.removeCell(cell);
        else
          model.addCell(cell);
      });
      day.model = me.buildScheduleDayModel(day.day);
    });
  }

  onColClick(col: number): void {
    let me = this, model = me.model, matching = me.isColMatching(col, me.schedule);
    (me.schedule || []).forEach(function (day) {
      (day.cells || []).forEach(function (cell, index) {
        if (index === col) {
          if (matching)
            model.removeCell(cell);
          else
            model.addCell(cell);
        }
      });
      day.model = me.buildScheduleDayModel(day.day);
    });
  }

  onDayClick(day: WeeklyScheduleDay): void {
    let me = this, model = me.model, matching = me.isDayMatching(day);
    (day.cells || []).forEach(function (cell) {
      if (matching)
        model.removeCell(cell);
      else
        model.addCell(cell);
    });
    day.model = me.buildScheduleDayModel(day.day);
  }

  onCellClick(day: WeeklyScheduleDay, cell: WeeklyScheduleCell, event: MouseEvent): void {
    let me = this, model = me.model, matching = model.isCellMatching(cell);
    if (matching) {
      if (event && event.shiftKey) {

        // Deselect multiple cells at once with a shift + click.
        me.getPreviousStatusCells(day, cell, 'selected', true).forEach(function (pair) {
          pair.cells.forEach(function (item) {
            model.removeCell(item);
          });
          pair.day.model = me.buildScheduleDayModel(pair.day.day);
        });
      } else {
        model.removeCell(cell);
        day.model = me.buildScheduleDayModel(day.day);
      }
    } else {
      if (event && event.shiftKey) {

        // Select multiple cells at once with a shift + click.
        me.getPreviousStatusCells(day, cell, 'unselected', true).forEach(function (pair) {
          pair.cells.forEach(function (item) {
            model.addCell(item);
          });
          pair.day.model = me.buildScheduleDayModel(pair.day.day);
        });

      } else {
        model.addCell(cell);
        day.model = me.buildScheduleDayModel(day.day);
      }
    }
  }

  getValue(): WeeklyScheduleEntryPlain[] {
    return this.model ? this.model.json() : [];
  }

  private getPreviousStatusCells(posDay: WeeklyScheduleDay,
    posCell: WeeklyScheduleCell,
    status: 'selected' | 'unselected',
    includePos: boolean): WeeklyScheduleDayCellsPair[] {
    let me = this, model = me.model, schedule = me.schedule, cells = posDay.cells,
      index = cells.indexOf(posCell), posDayValue = posDay.day, pair: WeeklyScheduleDayCellsPair,
      result: WeeklyScheduleDayCellsPair[] = [];

    if (includePos)
      result.push({ day: posDay, cells: [posCell] });

    for (let dayVal = posDayValue; dayVal >= 0; dayVal--) {
      let exit = false, day = schedule[dayVal],
        startIdx = dayVal === posDayValue ? index - 1 : day.cells.length - 1;
      for (let i = startIdx; i >= 0; i--) {
        let cell = day.cells[i];
        if (status === 'selected' && !model.isCellMatching(cell) ||
          status === 'unselected' && model.isCellMatching(cell)) {
          exit = true;
          break;
        }

        pair = result.find(function (item) {
          return item.day.day === dayVal;
        });
        if (pair)
          pair.cells.push(cell);
        else
          result.push({ day: day, cells: [cell] });
      }
      if (exit)
        break;
    }

    return result;
  }

  private isScheduleMatching(schedule: WeeklySchedule): boolean {
    let me = this;
    return (schedule || []).findIndex(function (day) {
      return !me.isDayMatching(day);
    }) === -1;
  }

  private isColMatching(col: number, schedule: WeeklySchedule): boolean {
    let me = this;
    return (schedule || []).findIndex(function (day) {
      return !me.isDayMatching(day, true, col);
    }) === -1;
  }

  private isDayMatching(day: WeeklyScheduleDay, matchCol?: boolean, col?: number): boolean {
    let model = this.model;
    return (day.cells || []).findIndex(function (cell, index) {
      let result = true;
      if (matchCol)
        result = index === col;
      return result && !model.isCellMatching(cell);
    }) === -1;
  }

  private detectResize(): void {
    let me = this, canvasEl = me.canvas && me.canvas.nativeElement ? me.canvas.nativeElement : null, w = 0,
      h = 0;
    if (canvasEl) {
      w = canvasEl.offsetWidth || 0;
      h = canvasEl.offsetHeight || 0;
      if (w !== me.oldWidth || h !== me.oldHeight) {
        me.oldWidth = w;
        me.oldHeight = h;
        me.ctx.xMax = w - me.ctx.operableAreaWidth;
      }
    }
  }

  private reviseOffset(offset: number, x: number, base: number): number {
    let reviseRatio = (x >= 12) ? Math.abs(x - 24) / 12 : x / 12;
    return offset - base * reviseRatio;
  }

  private bindResize(): void {
    this.resizeTimer = setInterval(this.detectResize.bind(this), 500);
  }

  private unbindResize(): void {
    if (this.resizeTimer)
      clearInterval(this.resizeTimer);
  }

  private initSchedule(): void {
    let me = this, days = [me.textSunday, me.textMonday, me.textTuesday, me.textWednesday, me.textThursday,
    me.textFriday, me.textSaturday];

    me.schedule = [];
    days.forEach(function (value, index) {
      let day: WeeklyScheduleDayValue = index as WeeklyScheduleDayValue;
      me.schedule.push({
        day: day,
        title: value,
        cells: me.buildScheduleDayCells(day),
        model: me.buildScheduleDayModel(day)
      });
    });
  }

  private getDayRange(day: WeeklyScheduleDayValue): WeeklyScheduleCell {
    let me = this, min = day * me.daySeconds, max = (day + 1) * me.daySeconds - 1;
    return { min: min, max };
  }

  private matchEntryInRange(entry: WeeklyScheduleEntry, range: WeeklyScheduleCell): boolean {
    return entry.start >= range.min && entry.end <= range.max;
  }

  private matchEntryLeftShiftRange(entry: WeeklyScheduleEntry, range: WeeklyScheduleCell): boolean {
    return entry.start < range.min && entry.end >= range.min && entry.end <= range.max;
  }

  private matchEntryRightwardShiftRange(entry: WeeklyScheduleEntry, range: WeeklyScheduleCell): boolean {
    return entry.start >= range.min && entry.start <= range.max && entry.end > range.max;
  }

  private matchEntryLeftRightwardShiftRange(entry: WeeklyScheduleEntry, range: WeeklyScheduleCell): boolean {
    return entry.start < range.min && entry.end > range.max;
  }

  private seconds2time(seconds: number): string {
    let secsInDay = seconds % this.daySeconds,
      hours = Math.floor(secsInDay / 3600), minutes = Math.floor((secsInDay - hours * 3600) / 60);
    return SharedService.formatString('{0}:{1}',
      hours,
      minutes < 10 ? '0' + minutes : minutes);
  }

  private buildScheduleDayModel(day: WeeklyScheduleDayValue): WeeklyScheduleEntry[] {
    let me = this, result = [], model = me.model, range = me.getDayRange(day);

    if (model) {
      const entries = model.getEntries();
      entries.forEach(function (entry) {
        if (me.matchEntryInRange(entry, range))
          result.push(entry);
        else if (me.matchEntryLeftShiftRange(entry, range))
          result.push(new WeeklyScheduleEntry(range.min, entry.end));
        else if (me.matchEntryRightwardShiftRange(entry, range))
          result.push(new WeeklyScheduleEntry(entry.start, range.max));
        else if (me.matchEntryLeftRightwardShiftRange(entry, range))
          result.push(new WeeklyScheduleEntry(range.min, range.max));
      });
    }
    return result;
  }

  private buildScheduleDayCells(day: WeeklyScheduleDayValue): WeeklyScheduleCell[] {
    let me = this, result = [], colCount = me.cellCols ? me.cellCols.length : 0,
      base = day * me.daySeconds, step = me.daySeconds / colCount;
    me.cellCols.forEach(function (col) {
      let start = base + col * step, end = start + step - 1;
      result.push({
        min: start,
        max: end
      });
    });
    return result;
  }

  private getSummary(): WeeklyScheduleSummary {
    let me = this, result: WeeklyScheduleSummary = [];

    me.schedule.forEach(function (item) {
      let se: WeeklyScheduleSummaryEntry;
      if (item.model && item.model.length > 0) {
        se = { day: item.day, startDay: item.title, times: [] };

        item.model.forEach(function (entry, index) {
          se.times.push({ start: me.seconds2time(entry.start), end: me.seconds2time(entry.end) });
        });
        result.push(se);
      }
    });
    if (result.length > 0)
      me.optimizeSummary(result);

    return result;
  }

  private matchSummaryEntryTimes(a: WeeklyScheduleSummaryEntry, b: WeeklyScheduleSummaryEntry): boolean {
    let result = false, atimes = a.times, btimes = b.times;
    if (a.day + 1 === b.day && atimes.length === btimes.length) {
      result = true;
      for (let i = 0; i < atimes.length; i++) {
        if (atimes[i].start !== btimes[i].start || atimes[i].end !== btimes[i].end) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  private optimizeSummary(summary: WeeklyScheduleSummary): void {
    let me = this, optimizing = false, len = summary ? summary.length : 0;
    if (len > 1) {
      for (let i = 0; i < summary.length; i++) {
        let entry: WeeklyScheduleSummaryEntry, next: WeeklyScheduleSummaryEntry;
        if (i < len - 1) {
          entry = summary[i];
          next = summary[i + 1];
          if (me.matchSummaryEntryTimes(entry, next)) {
            summary.splice(i, 2, {
              day: next.day, startDay: entry.startDay, endDay: next.startDay,
              times: entry.times
            });
            optimizing = true;
            break;
          }
        }
      }
      if (optimizing)
        me.optimizeSummary(summary);
    }
  }

  private resetScheduleModel(): void {
    let me = this;
    (me.schedule || []).forEach(function (item) {
      item.model = me.buildScheduleDayModel(item.day);
    });
  }
}
