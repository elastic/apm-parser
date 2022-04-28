import fs from 'fs/promises';
import { existsSync } from 'fs';
import { initClient } from './es_client';
import path from 'path';

type CLIParams = {
  dir: string;
  type: string;
  param: {
    journeyName: string;
    buildId: string;
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
  const hits = await esClient.getTransactions(param.buildId, param.journeyName);
  if (!hits || hits.length === 0) {
    console.warn(`No transactions found with 'labels.testBuildId=${param.buildId}' and 'labels.journeyName=${param.journeyName}'\n Output file won't be generated`);
    return;
  }

  const source = hits[0]._source;
  const journeyName = source.labels.journeyName || 'Unknown Journey';
  const kibanaVersion = source.service.version;
  const maxUsersCount = source.labels.maxUsersCount || '0';

  const data = hits.map(hit => hit._source).map(hit => {
    return  {
      processor: hit.processor,
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

  const output = {
    journeyName,
    kibanaVersion,
    maxUsersCount,
    traceItems: data,
  }

  const outputDir = path.resolve('output');
  const fileName = `${output.journeyName.replace(/ /g,'')}-${param.buildId}.json`
  const filePath = path.resolve(outputDir, fileName);

  console.log(`Found ${hits.length} transactions, output file: ${filePath}`);
  if (!existsSync(outputDir)) {
    await fs.mkdir(outputDir);
  }
  await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
};

export default apmParser;
