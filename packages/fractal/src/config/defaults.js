module.exports = {

  src: null,

  cache: {
    ttl: 0,
    check: 600
  },

  resolve: {
    alias: {}
  },

  components: {
    match: file => file.stem.startsWith('@'),
    config: {
      match: '**/config.*',
      defaults: {
        views: {
          match: 'view.*',
        },
        assets: {
          styles: '**/*.{css,scss}',
          scripts: '**/*.js',
          images: '**/*.{svg,png,jpg,jpeg,gif}',
          media: '**/*.{webm,mp4,ogg}',
          fonts: '**/*.{woff,woff2}'
        }
      }
    },
    templates: {
      globals: {}
    }
  },

  presets: [],

  engines: [],

  plugins: [],

  transforms: [
    require('@frctl/fractal-transform-components')
  ]

};
