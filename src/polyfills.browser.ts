// Polyfills

// import 'ie-shim'; // Internet Explorer 9 support

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE9, IE10 and IE11 requires all of the following polyfills. */
import 'core-js/es6/symbol';
import 'core-js/es6/object';
import 'core-js/es6/function';
import 'core-js/es6/parse-int';
import 'core-js/es6/parse-float';
import 'core-js/es6/number';
import 'core-js/es6/math';
import 'core-js/es6/string';
import 'core-js/es6/date';
import 'core-js/es6/array';
import 'core-js/es6/regexp';
import 'core-js/es6/map';
import 'core-js/es6/set';

// see issue https://github.com/AngularClass/angular2-webpack-starter/issues/709
// import 'core-js/es6/promise';

/** Evergreen browsers require these. */
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';

/** IE10 and IE11 requires the following for NgClass support on SVG elements */
import 'classlist.js';  // Run `npm install --save classlist.js`.

/** IE10 and IE11, Firefox requires the following to support `@angular/animation`. */
import 'web-animations-js';  // Run `npm install --save web-animations-js`.

// Typescript emit helpers polyfill
// import 'ts-helpers'; // Don't need this anymore since we use TS > 2.1 (https://github.com/ngParty/ts-helpers)

// if ('production' === ENV) {
//   // Production
//
//
// } else {
//   // Development
//
//   Error.stackTraceLimit = Infinity;
//
//   require('zone.js/dist/long-stack-trace-zone');
//
// }

/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI. (ALso included in ng2admin plugin, keep)


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

/**
 * Date, currency, decimal and percent pipes.
 * Needed for: All but Chrome, Firefox, Edge, IE11 and Safari 10
 */
import 'intl';  // Run `npm install --save intl`.
import 'intl/locale-data/jsonp/en';
import 'core-js/es7/array';

if (typeof SVGElement.prototype.contains === 'undefined') {
  SVGElement.prototype.contains = HTMLDivElement.prototype.contains;
}

/**
 * svgxuse.
 * A simple polyfill that fetches external SVGs referenced in <use> elements when the browser itself fails to do so.
 * see https://www.npmjs.com/package/svgxuse
 */
import 'svgxuse'; // Run `npm install --save svgxuse`.
