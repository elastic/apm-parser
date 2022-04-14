// @ts-nocheck
import { writeFile } from 'fs/promises';
import { Environment } from './ApmClient';
import { initClient } from './es_client'

type CLIParams = {
  dir: string;
  type: string;
  param: {
    start: string;
    end: string;
    environment: Environment;
    kuery: string;
    jobId: string;
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

const apmParser = async ({ param, client }: CLIParams) => {
  const authOptions = {
    node: client.baseURL,
    username: client.auth.username,
    password: client.auth.password,
  }
  const esClient = initClient(authOptions);
  const hits = await esClient.getTransactions(param.jobId);
  if (!hits && hits.length === 0) {
    throw new Error('No transactions found')
  }
  const data = hits.map(hit => hit._source).map(hit => {
    return  {
      processor: hit.processor,
      labels: hit.labels,
      traceId : hit.trace.id,
      timestamp: hit["@timestamp"],
      environment: hit.environment,
      request: {
        url: { path: hit.url.path },
        headers: hit.http.request.headers,
        method: hit.http.request.method,
        body: hit.http.request.body ? JSON.parse(hit.http.request.body.original) : '',
      },
      response: {statusCode: hit.http.response.status_code},
      transaction: {
        id: hit.transaction.id,
        name: hit.transaction.name,
        type: hit.transaction.type,
      }
    }
  });

  console.log(`Found ${hits.length} hits`);

  const output = {
    journeyName: "Sample Journey Name",
    journeyTime: 300000,
    kibanaVersion: "v7.17.1",
    kibanaUrl: "https://kibana-ops-e2e-perf.kb.us-central1.gcp.cloud.es.io/",
    maxUsersCount: 1,
    traceItems: data,
  }

  await writeFile(`trace.json`, JSON.stringify(output, null, 2), 'utf8');
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
