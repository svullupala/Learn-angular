import {Pipe, PipeTransform} from '@angular/core';
import {MD5} from '../util/md5';

/**
 * Generate a MD5 message digest (string) for a given string.
 *
 * Usage:
 *    value | md5
 * Example:
 *    <Add Example here>
 */
@Pipe({name: 'md5'})
export class MD5Pipe implements PipeTransform {
  transform(str: string, raw?: boolean, hexcase?: boolean, chrsz?: number): string {
    return MD5.encode(str, raw, hexcase, chrsz);
  }
}
