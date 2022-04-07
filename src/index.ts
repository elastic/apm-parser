// @ts-nocheck
import { writeFile } from 'fs/promises';
import bluebird from 'bluebird';
import { Events } from './types';
import tree from './tree';
import { ApmClient, Environment } from './ApmClient';
import _ from 'lodash';
import * as sanitize from "./sanitize";

type CLIParams = {
  dir: string;
  type: string;
  param: {
    start: string;
    end: string;
    environment: Environment;
    kuery: string;
    transactionType: string[];
  };
  client: {
    auth: {
      username: string;
      password: string;
    };
    baseURL: string;
  };
};

const enrichTrace = async (transactionName: string, transactionType: string, service: string, api: ApmClient, params: Omit<CLIParams['param'], 'transactionType'>) => {
  const traceSamples = await api.getTraceSamples({
    ...params,
    transactionName,
    transactionType,
    service,
  });

  const uniqueTraceSamples = _.uniqBy(traceSamples, 'traceId')

  const traces = await bluebird.map<_, Events[]>(uniqueTraceSamples, ({ traceId }) => api.getTrace({
    id: traceId,
    start: params.start,
    end: params.end
  }), { concurrency: 10 });


  const rawTraces = traces.map(events => tree(events.map(sanitize.scalability))).filter(e => !_.isEmpty(e))

  return {
    service,
    transactionType,
    transactionName,
    traces: rawTraces
  }
};

const apmParser = async ({ param, client }: CLIParams) => {
  const api = new ApmClient(client);
  console.log(`Querying APM with condition (${param.kuery}) starting from ${param.start} and ending at ${param.end}`);

  const transactionGroupMainStatistics = await Promise.all(param.transactionType.map(transactionType => api.getTransactionGroupMainStatistics(transactionType === 'http-request' ? 'kibana-frontend' : 'kibana', {
    latencyAggregationType: 'avg',
    transactionType,
    ..._.pick(param, ['start', 'end', 'kuery', 'environment'])
  })))

  const response = await bluebird.mapSeries(transactionGroupMainStatistics.flat(), i => {
    const service = i.transactionType === 'http-request' ? 'kibana-frontend' : 'kibana'
    return enrichTrace(i.name, i.transactionType, service, api, param)
  });

  const output = {
    journeyName: "Sample Journey Name",
    journeyTime: 300000,
    kibanaVersion: "v7.17.1",
    kibanaUrl: "https://kibana-ops-e2e-perf.kb.us-central1.gcp.cloud.es.io/",
    maxUsersCount: 1,
    traceItems: response,
  }

  await writeFile(`trace.json`, JSON.stringify(output));
};

// enrichTrace(
//   'POST /internal/bsearch',
//   'request',
//   'kibana',
//   new ApmClient({ auth: { username: "apm-parser-performance", password: "performance2022", }, baseURL: 'https://kibana-ops-e2e-perf.kb.us-central1.gcp.cloud.es.io' }),
//   {
//     start: '2022-03-29T00:01:00.000Z',
//     end: '2022-03-29T23:59:00.000Z',
//     kuery: "labels.testJobId:local-9bb12252-f167-45c4-8a34-8158fa4bc8d5",
//     environment: Environment.ENVIRONMENT_ALL
//   }
// ).then().catch(console.error)

export default apmParser;
