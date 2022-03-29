import { writeFile } from 'fs/promises';

import tree from './tree';
import { ApmClient, Environment, TracesResponse } from './ApmClient';

type CLIParams = {
  dir: string;
  param: {
    start: string;
    end: string;
    environment: Environment;
    kuery: string;
  };
  client: {
    auth: {
      username: string;
      password: string;
    };
    baseURL: string;
  };
};

type TraceItem = TracesResponse['items'][0];

const enrichTrace = async (traceItem: TraceItem, api: ApmClient, params: CLIParams['param']) => {
  const { serviceName, transactionType, transactionName } = traceItem;

  const traceSamples = await api.getTraceSamples({
    service: serviceName,
    transactionType,
    transactionName,
    ...params,
  });

  const trace = await api.getTrace({ id: traceSamples[0].traceId, start: params.start, end: params.end });
  traceItem['root'] = tree(trace.traceDocs);

  return traceItem;
};

const apmParser = async ({ dir, param, client }: CLIParams) => {
  const api = new ApmClient(client);

  const traces = await api.getTraces(param);

  const traceItems = await Promise.all(traces.map((t) => enrichTrace(t, api, param)));

  await writeFile(`${dir}/traces-${param.kuery}.json`, JSON.stringify(traceItems));
};

export default apmParser;
