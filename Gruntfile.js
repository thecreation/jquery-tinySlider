'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        // Task configuration.
        // -- clean config ----------------------------------------------------------
        clean: {
            files: ['dist']
        },
        // -- copy config ----------------------------------------------------------
        copy: {
            easing: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'bower_components/easing.css',
                    src: [
                        'css/easing.css'
                    ],
                    dest: 'css/'
                }]
            },
            jquery: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'bower_components/jquery',
                    src: [
                        'jquery.min.js'
                    ],
                    dest: 'demo/js/'
                }]
            }
        },
        // -- concat config ----------------------------------------------------------
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['src/<%= pkg.name %>.js'],
                dest: 'dist/<%= pkg.name %>.js'
            },
        },
        // -- uglify config ----------------------------------------------------------
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            },
        },
        // -- jshint config ----------------------------------------------------------
        jshint: {
            gruntfile: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: 'Gruntfile.js'
            },
            src: {
                options: {
                    jshintrc: 'src/.jshintrc'
                },
                src: ['src/**/*.js']
            },
        },
        // -- less config ----------------------------------------------------------
        less: {
            dist: {
                files: {
                    'css/tinySlider.css': ['less/tinySlider.less']
                }
            }
        },

        // -- autoprefixer config ----------------------------------------------------------
        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
            },
            src: {
                expand: true,
                cwd: 'css/',
                src: ['tinySlider.css'],
                dest: 'css/'
            }
        },
        // -- autoprefixer config ----------------------------------------------------------
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            src: {
                files: '<%= jshint.src.src %>',
                tasks: ['jshint:src']
            },
        },
        // -- autoprefixer config ----------------------------------------------------------
        replace: {
            bower: {
                src: ['bower.json'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: /("version": ")([0-9\.]+)(")/g,
                    to: "$1<%= pkg.version %>$3"
                }]
            },
            jquery: {
                src: ['tinyslider.jquery.json'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: /("version": ")([0-9\.]+)(")/g,
                    to: "$1<%= pkg.version %>$3"
                }]
            },
        },
        // -- autoprefixer config ----------------------------------------------------------
        jsbeautifier: {
            files: ["src/**/*.js", 'Gruntfile.js'],
            options: {
                indent_size: 1,
                indent_char: "	",
                indent_level: 0,
                indent_with_tabs: true,
                preserve_newlines: true,
                max_preserve_newlines: 10,
                jslint_happy: false,
                brace_style: "collapse",
                keep_array_indentation: false,
                keep_function_indentation: false,
                space_before_conditional: true,
                eval_code: false,
                indent_case: false,
                wrap_line_length: 150,
                unescape_strings: false
            }
        }
    });

    // Load npm plugins to provide necessary tasks.
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*']
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'dist']);

    grunt.registerTask('dist', ['concat', 'uglify']);
    grunt.registerTask('js', ['jsbeautifier', 'jshint']);
    grunt.registerTask('css', ['less', 'autoprefixer']);

    grunt.registerTask('version', [
        'replace:bower',
        'replace:jquery'
    ]);
};
