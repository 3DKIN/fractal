'use strict';

module.exports = {
    port: 3000,
    static: {
        path: null,
        mount: "/"
    },
    build: {
        dest: "build"
    },
    theme: "@frctl/theme-default"
};
