'use strict';
const nconf = require('nconf');
const path = require('path');
const CONFIG_FILE_NAME = 'config.json';

nconf.argv().env().file({
    file: path.join(__dirname, CONFIG_FILE_NAME)
});


module.exports = nconf;
