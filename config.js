module.exports = {
    dev: false,
    log: {
        level: "warn"
    },
    project: {
        title: "Fractal",
        version: null
    },
    server: {
        port: 3000
    },
    static: {
        path: null,
        dest: "/"
    },
    build: {
        dest: "build"
    },
    theme: {
        name: "@frctl/theme-default",
        config: null,
        paths: {}
    },
    generator: {
        config: {
            name: "{{name}}.config.js"
        },
        pages: {
            name: "{{name}}.md"
        }
    },
    components: {
        path: null,
        config: "{{name}}\\.config\\.(js|json|yml|yaml)",
        readme: "readme\\.(md|markdown)",
        preview: {
            layout: null,
            yield: "yield"
        },
        splitter: "--",
        view: {
            engine: "handlebars",
            context: {}
        }
    },
    pages: {
        path: null,
        config: "{{name}}\\.config\\.(js|json|yml|yaml)",
        match: ".*\\.(html|md|markdown)",
        handler: "handlers/pages/markdown",
        indexLabel: "Overview"
    },
    statuses: {
        default: "ready",
        options: [
            {
                name: "prototype",
                label: "Prototype",
                description: "Do not implement.",
                color: "red"
            },
            {
                name: "wip",
                label: "WIP",
                description: "Work in progress. Implemement with caution.",
                color: "orange"
            },
            {
                name: "ready",
                label: "Ready",
                description: "Ready to implement.",
                color: "green"
            }
        ]
    },
    engines: {
        handlebars: {
            name: "handlebars",
            ext: ".hbs",
            handler: "src/engines/handlebars",
            extend: {
                helpers: {}
            }
        },
        nunjucks: {
            name: "nunjucks",
            ext: ".nunjucks",
            handler: "src/engines/nunjucks",
            extend: {
                filters: {},
                globals: {},
                extensions: {}
            }
        }
    },
    fractal: {
        site: {
            url: "http://fractal.clearleft.com"
        },
        docs: {

        },
        bugs: {
            url: "mailto:dev@clearleft.com"
        }
    }
}
