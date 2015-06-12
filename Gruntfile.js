module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat:{
            basic:{
                src: [
                    'node_modules/es6-promise/dist/es6-promise.min.js',
                    'js/build/isis-member.js',
                    'js/build/isis-collection.js',
                    'js/build/isis-action.js',
                    'js/build/isis-rest-reader.js',
                    'js/build/isis-ajax.js',
                    'js/build/isis-auth.js'
                ],
                dest: 'js/combined/isis.js',
            }
        },
        uglify: {
            basic: {
                src: 'js/combined/isis.js',
                dest: 'js/min/isis.min.js'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'js/build/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // Default task(s).

    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
