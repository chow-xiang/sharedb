"use strict"

const env = process.env.ENV || 'dev'

const yaml = require('node-yaml')
const mq = yaml.readSync('./mq.yaml')[env]

module.exports = { mq }
