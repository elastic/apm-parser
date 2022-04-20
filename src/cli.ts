#!/usr/bin/env node
import apmParser from './index';

import yargs from "yargs";
import { hideBin } from "yargs/helpers"

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
    j: {
      alias: 'jobId',
      demandOption: false,
      describe: 'Journey Job Id',
      default: '',
      type: 'string',
    },
    tt: {
      alias: 'transactionType',
      demandOption: false,
      describe: 'Transaction Type',
      default: ['request'],
      type: 'array',
    },
    d: {
      alias: 'dir',
      demandOption: false,
      describe: 'Output directory',
      default: 'artifacts',
      type: 'string',
    },
    t: {
      alias: 'type',
      describe: 'Output type (scalability, esperf)',
      default: 'scalability',
      type: 'string'
    }
  })
  .help('h')
  .alias('h', 'help').argv;

apmParser({
  dir: argv.d,
  type: argv.t,
  param: { start: argv.s, end: argv.e, kuery: argv.k, jobId: argv.j, environment: argv.n, transactionType: argv.tt },
  client: { auth: { username: argv.u, password: argv.p }, baseURL: argv.c },
})
  .then(() => console.log('Apm parser finished successfully'))
  .catch((e) => console.error('Apm parser failed\n', e));