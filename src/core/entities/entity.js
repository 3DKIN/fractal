'use strict';

const _            = require('lodash')
const utils        = require('../utils');
const Log          = require('../log');
const mix          = require('../mixins/mix');
const Heritable    = require('../mixins/heritable');
const EntityMixin  = require('../mixins/entity');

module.exports = class Entity extends mix(Heritable, EntityMixin) {

    constructor(name, config, parent){
        super();
        this.isEntity = true;
        this.initEntity(name, config, parent);
        this.setHeritable(parent);
    }

}
