#!/usr/bin/env node
import apmParser from './index';

import yargs from "yargs";
import { hideBin } from "yargs/helpers"

const argv = yargs(hideBin(process.argv))
  .scriptName('performance-testing-dataset-extractor')
  .usage('Usage: yarn cli -u <username> -p <password> -c <es_host> -b <testBuildId> -n <journeyName>')
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
    c: {
      alias: 'cluster',
      demandOption: false,
      describe: 'ES Cluster',
      default: 'https://kibana-ops-e2e-perf.es.us-central1.gcp.cloud.es.io:9243',
      type: 'string',
    },
    b: {
      alias: 'buildId',
      demandOption: true,
      describe: 'Journey Build Id',
      default: '',
      type: 'string',
    },
    n: {
      alias: 'journeyName',
      demandOption: true,
      describe: 'Journey Name',
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
  param: { journeyName: argv.n, buildId: argv.b, transactionType: argv.tt },
  client: { auth: { username: argv.u, password: argv.p }, baseURL: argv.c },
})
  .then(() => console.log('Dataset extractor finished successfully'))
  .catch((e) => console.error('Dataset extractor failed\n', e));