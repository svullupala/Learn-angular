// Karma configuration
// Generated on Wed May 24 2017 12:20:15 GMT-0400 (Eastern Daylight Time)
var webpackConfig = require('./config/webpack.test.js')({ env: 'test'});
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of plugins
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-webpack')
    ],

    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },

    files: [
      { pattern: './config/spec-bundle.js', watched: false }
    ],

    // A map of path-proxy pairs.
    proxies: {
        '/src/': '/base/src/'
    },

    // list of files to exclude
    exclude: [
    ],

    // Redefine default mapping from file extensions to MIME-type
    // For the browser to recognize ts files content type in the header.
    mime: {
      'text/x-typescript': ['ts','tsx']
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // './src/**/*.ts' : ['webpack'],
      './config/spec-bundle.js': ['webpack']
    },

    webpack: webpackConfig,
      // karma watches the test entry points
      // (you don't need to specify the entry option)
      // webpack watches dependencies

      // webpack configuration

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'kjhtml'],

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
