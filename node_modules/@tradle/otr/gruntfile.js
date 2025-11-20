module.exports = function (grunt) {
  "use strict";

  var cryptojs = [
      'vendor/cryptojs/header.js'
    , 'vendor/cryptojs/core.js'
    , 'vendor/cryptojs/enc-base64.js'
    , 'vendor/cryptojs/cipher-core.js'
    , 'vendor/cryptojs/aes.js'
    , 'vendor/cryptojs/sha1.js'
    , 'vendor/cryptojs/sha256.js'
    , 'vendor/cryptojs/hmac.js'
    , 'vendor/cryptojs/pad-nopadding.js'
    , 'vendor/cryptojs/mode-ctr.js'
    , 'vendor/cryptojs/footer.js'
  ]

  var BUILTINS = ['events', 'path', '_process']

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

      pkg: grunt.file.readJSON('package.json')
    , meta: {
          banner:
            '/*!\n\n  <%= pkg.name %>.js v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '  (c) <%= grunt.template.today("yyyy") %> - <%= pkg.author %>\n' +
            '  Freely distributed under the <%= pkg.license %> license.\n\n' +
            '  This file is concatenated for the browser.\n' +
            '  Please see: <%= pkg.homepage %>' +
            '\n\n*/\n\n'
      }
    , clean: {
        folder: 'build/'
      }
    , jshint: {
          options: {
            jshintrc: '.jshintrc'
          }
        , all: ['*.js', 'lib/*.js', 'test/spec/unit/*.js']
      }
    , browserify: {
        dev: {
          files: {
            'build/bundle.js': 'index.js'
          },
          options: {
            banner: '<%= meta.banner %>',
            exclude: ['webworker-threads'],
            browserifyOptions: {
              builtins: BUILTINS,
              standalone: 'otr'
            }
          }
        },
        min: {
          files: {
            'build/bundle.min.js': 'index.js'
          },
          options: {
            banner: '<%= meta.banner %>',
            exclude: ['webworker-threads'],
            configure: function(bundle) {
              bundle.transform({
                global: true
              }, 'uglifyify')
            },
            browserifyOptions: {
              builtins: BUILTINS,
              standalone: 'otr'
            }
          }
        }
      }
  })

  grunt.registerTask('copy_dep', function () {
    var files = ['salsa20.js']
      , src = 'vendor/'
      , dest = 'build/dep/'
    files.forEach(function (f) {
      grunt.file.copy(src + f, dest + f)
    })
  })

  grunt.registerTask('copy_ww', function () {
    var files = ['dsa-webworker.js', 'sm-webworker.js']
      , src = 'lib/'
      , dest = 'build/'
    files.forEach(function (f) {
      grunt.file.copy(src + f, dest + f)
    })
  })

  // grunt.registerTask('otr', ['concat:otr', 'uglify:otr'])
  grunt.registerTask('ww', ['copy_ww'])
  grunt.registerTask('dev', ['clean', 'browserify:dev', 'copy_dep', 'ww'])
  grunt.registerTask('default', ['clean', 'browserify', 'copy_dep', 'ww'])

}
