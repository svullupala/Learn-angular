import {BaseModel} from '../models/base.model';
import {SelectorService} from './selector.service';
import {SimpleSelectorService} from './simple-selector.service';
import {MultihierSelectorService} from './multihier-selector.service';
import {GenericSelectorService, HasEquals} from './generic-selector.service';


export enum SelectorType {
  SIMPLE,
  MULTIHIER
}

/**
 * Selector Factory.
 * @param type
 * @returns {SelectorService<BaseModel>}
 */
export function selectorFactory(type: SelectorType): SelectorService<BaseModel> {
  let selector: SelectorService<BaseModel>;
  switch (type) {
    case SelectorType.SIMPLE:
      selector = new SimpleSelectorService();
      break;
    case SelectorType.MULTIHIER:
      selector = new MultihierSelectorService();
      break;
    default:
      break;
  }
  return selector;
}

/**
 * Generic Selector Factory.
 * @returns {SelectorService<T>}
 */
export function genericSelectorFactory<T extends HasEquals<T>>(): SelectorService<T> {
  return new GenericSelectorService<T>();
}
