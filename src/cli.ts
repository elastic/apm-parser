#!/usr/bin/env node
import apmParser from './index';

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Environment } = require('./ApmClient');

const argv = yargs(hideBin(process.argv))
  .scriptName('apm-parser')
  .usage('Usage: $0 [options]')
  .example("$0 -s '2022-03-29T01:20:00.000Z'", 'extract apm data starting from date specified')
  .options({
    u: {
      alias: 'user',
      demandOption: true,
      describe: 'Username',
      type: 'string',
    },
    p: {
      alias: 'pwd',
      demandOption: true,
      describe: 'Password',
      type: 'string',
    },
    s: {
      alias: 'start',
      demandOption: true,
      describe: 'Start Date',
      type: 'string',
    },
    c: {
      alias: 'cluster',
      demandOption: false,
      describe: 'APM Cluster',
      default: 'https://kibana-ops-e2e-perf.kb.us-central1.gcp.cloud.es.io',
      type: 'string',
    },
    e: {
      alias: 'end',
      demandOption: false,
      describe: 'End Date',
      default: new Date().toISOString(),
      type: 'string',
    },
    k: {
      alias: 'kuery',
      demandOption: false,
      describe: 'Kibana Query Language (KQL)',
      default: '',
      type: 'string',
    },
    n: {
      alias: 'env',
      demandOption: false,
      describe: 'Environment',
      default: Environment.ENVIRONMENT_ALL,
      type: 'string',
    },
    d: {
      alias: 'dir',
      demandOption: false,
      describe: 'Output directory',
      default: 'artifacts',
      type: 'string',
    },
  })
  .help('h')
  .alias('h', 'help').argv;

apmParser({
  dir: argv.dir,
  param: {
    start: argv.start,
    end: argv.end,
    kuery: argv.kuery,
    environment: argv.env,
  },
  client: {
    auth: {
      username: argv.user,
      password: argv.pwd,
    },
    baseURL: argv.cluster,
  },
})
  .then((_) => console.log('Apm parser finished successfully'))
  .catch((e) => console.error('Apm parser failed\n', e));
