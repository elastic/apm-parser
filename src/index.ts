// @ts-nocheck
import { writeFile } from 'fs/promises';
import bluebird from 'bluebird';
import { Events } from './types';
import tree from './tree';
import { ApmClient, Environment } from './ApmClient';
import _ from 'lodash';
import * as sanitize from "./sanitize";

import {initClient} from './es_client'

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
  const authOptions = {
    node: 'https://apm-7-17.es.us-central1.gcp.cloud.es.io:9243',
    username: process.env.ES_USER,
    password: process.env.ES_PSWD,
  }
  const esClient = initClient(authOptions);
  const hits = await esClient.getTransactions(process.env.JOB_ID); // '2022-04-13T11:31:18.192Z'
  // with login: "local-a1715652-65b8-4125-8a42-ddbe99f9d63f"
  // without login: local-b47b6b73-067b-44af-a9ff-4a7fabda271d
  if (hits && hits.length > 0) {
    const data = hits.map(hit => hit._source).map(hit => {
      return  {
        // processor: hit.processor,
        // labels: hit.labels,
        traceId : hit.trace.id,
        timestamp: hit["@timestamp"],
        // environment: hit.environment,
        request: {
          url: { path: hit.url.path },
          // headers: hit.http.request.headers,
          method: hit.http.request.method,
          body: hit.http.request.body ? JSON.parse(hit.http.request.body.original) : '',
        },
        // response: {statusCode: hit.http.response.status_code},
        transaction: {
          id: hit.transaction.id,
          name: hit.transaction.name,
          type: hit.transaction.type,
        }
      }
    });

    data.forEach(i => console.log(JSON.stringify(i)));
    console.log(`Found ${hits.length} hits`);
    await writeFile('./transactions.json',JSON.stringify(data, null, 2), 'utf8');
  }
  return;
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
