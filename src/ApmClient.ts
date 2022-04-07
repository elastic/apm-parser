/* eslint-disable require-jsdoc */
import curlirize from 'axios-curlirize';
import { Events } from './types';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';

const defaultConfig: AxiosRequestConfig = {
  headers: {
    'content-type': 'application/json',
  },
};

export type TracesResponse = {
  items: {
    key: {
      'service.name': string;
      'transaction.name': string;
    };
    averageResponseTime: number;
    transactionsPerMinute: number;
    transactionType: string;
    impact: number;
    transactionName: string;
    serviceName: string;
  }[];
}

export type TransactionGroup = {
  name: string;
  latency: number;
  throughput: number;
  errorRate: number;
  impact: number;
  transactionType: string;
}

export type TransactionsGroupsMainStatisticsResponse = {
  transactionGroups: TransactionGroup[];
  isAggregationAccurate: boolean;
  bucketSize: number;
}

export enum Environment {
  ENVIRONMENT_NOT_DEFINED = 'ENVIRONMENT_NOT_DEFINED',
  ENVIRONMENT_ALL = 'ENVIRONMENT_ALL',
  CI = 'ci',
}

type BaseRequest = {
  environment: Environment;
  start: string;
  end: string;
};

type TransactionsGroupsMainStatisticsRequestParams = BaseRequest & {
  kuery?: string;
  transactionType: string;
  latencyAggregationType: string;
}

type TraceSamplesRequestParams = BaseRequest & {
  kuery?: string;
  transactionType: string;
  transactionName: string;
  service: string;
};

type TraceRequestParams = {
  id: string;
  start: string;
  end: string;
};

export type TraceResponse = {
  errorDocs: any[];
  exceedsMax: boolean;
  traceDocs: Events[];
};

type TraceSamplesResponse = {
  noHits: boolean;
  traceSamples: { transactionId: string; traceId: string }[];
};

class NetworkError extends Error {
  constructor(public message: string, public url: string) {
    super(message);
    this.name = 'NetworkError';
    this.url = url;
  }
}

class APIError extends Error {
  constructor(public message: string, public statusCode: number, public data: AxiosResponse['data']) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

function handleError(err: Error | AxiosError, url: string) {
  if (!axios.isAxiosError(err)) {
    throw err;
  }

  if (err.response) {
    throw new APIError('API Error Detected', err.response.status, err.response.data);
  }

  throw new NetworkError('Network Error!', url);
}

export class ApmClient {
  private readonly client: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.client = axios.create({
      ...defaultConfig,
      auth: config.auth,
      baseURL: config.baseURL + ':9243/internal/apm',
      timeout: 1000 * 120
    });

    if (process.env.NODE_ENV === 'development') {
      curlirize(this.client);
    }
  }

  public get baseUrl(): string | undefined {
    return this.client.defaults.baseURL;
  }

  async getTraceSamples({ service, ...params }: TraceSamplesRequestParams) {
    const route = `services/${service}/transactions/traces/samples`;

    try {
      console.info(`GET ${route} ${JSON.stringify(params)}`)
      const { data } = await this.client.get<TraceSamplesResponse>(route, { params });
      console.info(`Total trace samples count: ${data.traceSamples.length}`);
      return data.traceSamples;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }

  async getTransactionGroupMainStatistics(service: string, params: TransactionsGroupsMainStatisticsRequestParams) {
    const route = `services/${service}/transactions/groups/main_statistics`;

    try {
      console.info(`GET ${route} ${JSON.stringify(params)}`)
      const { data } = await this.client.get<TransactionsGroupsMainStatisticsResponse>(route, { params });
      console.info(`Total transaction groups count: ${data.transactionGroups.length}`);
      return data.transactionGroups.map(t => _.pick(t, 'transactionType', 'name'));
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }

  async getTrace({ id, ...params }: TraceRequestParams) {
    const route = `traces/${id}`;
    try {
      const { data } = await this.client.get<TraceResponse>(route, { params });
      console.info(`Trace id ${id} fetched`)
      return data.traceDocs;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }

  async getTraces(params: BaseRequest & { kuery?: string }) {
    const route = `traces`;
    try {
      console.info(`Fetching traces from ${route} endpoint`)
      const { data } = await this.client.get<TracesResponse>(route, { params });
      const prettyText = JSON.stringify(data.items.map(i => _.pick(i, ["serviceName", "transactionName", "transactionType"])), null, 4)
      console.info(`Fetched traces: \n${prettyText}`);
      console.info(`Total count: ${data.items.length}`);
      return data.items;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }
}
