import {ErrorModel} from 'shared/models/error.model';

export type DummyEntry =
  {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    pattern: string | RegExp,
    response?: object,
    delay? : number, 
    error?: ErrorModel
  };

export type DummyEntryPlain =
  {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    pattern: string,
    regexp?: boolean,
    delay?: number,
    response?: object,
    error?: { id: string, title: string, message: string }
  };
