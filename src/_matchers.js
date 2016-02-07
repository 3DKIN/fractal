'use strict';

const anymatch = require('anymatch');
const _        = require('lodash');

module.exports = function(config){

    const pExt      = config.get('pages.ext').toLowerCase();
    const cExt      = config.get('components.view.ext');
    const splitter  = config.get('components.splitter');

    return {
        components:     file => anymatch([`**/*${cExt}`, `!**/*${splitter}*${cExt}`], file.path),

        variants:       file => anymatch(`**/*${splitter}*${cExt}`, file.path),

        pages:          file => anymatch(`**/*${pExt}`, file.path),

        configs:        file => anymatch(`**/*.config.{js,json,yaml,yml}`, file.path),

        readmes:        file => anymatch(`**/readme.md`, file.path.toLowerCase()),
    }



    // Finders

    // findComponent:  (name, files) => _.find(files, { name: name, ext: cExt }),
    //
    // findVariantsOf: (name, files) => files.filter(self.variants).filter(file => file.name.startsWith(`${name}${splitter}`)),
    //
    // findConfigFor:  (name, files) => _.find(files.filter(self.configs), file => file.name.startsWith(`${name}.`)),
    //
    // findReadme: (files) => {
    //     const rms = files.filter(self.readmes);
    //     return rms.length ? rms[0] : null;
    // },
    //
    // // other
    //
    // splitHandle: (handle) => {
    //     const hp = handle.split(splitter);
    //     return {
    //         component: hp[0],
    //         variant: hp[1],
    //     };
    // }
};
