/* eslint-disable require-jsdoc */
import curlirize from 'axios-curlirize';
import { Events } from './types';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const defaultConfig: AxiosRequestConfig = {
  headers: {
    'content-type': 'application/json',
  },
};

export interface TracesResponse {
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

type TraceResponse = {
  errorDocs: any[];
  exceedsMax: boolean;
  traceDocs: Events;
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
    });

    if (process.env.NODE_ENV === 'development') {
      curlirize(this.client);
    }
  }

  public get baseUrl(): string | undefined {
    return this.client.defaults.baseURL;
  }

  async getTraceSamples({
    service,
    ...params
  }: TraceSamplesRequestParams): Promise<TraceSamplesResponse['traceSamples']> {
    const route = `services/${service}/transactions/traces/samples`;

    try {
      const { data } = await this.client.get<TraceSamplesResponse>(route, { params });
      return data.traceSamples;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }

  async getTrace({ id, ...params }: TraceRequestParams): Promise<TraceResponse> {
    const route = `traces/${id}`;
    try {
      const { data } = await this.client.get(route, { params });
      return data;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }

  async getTraces(params: BaseRequest & { kuery?: string }): Promise<TracesResponse['items']> {
    const route = `traces`;
    try {
      const { data } = await this.client.get(route, { params });
      return data.items;
    } catch (err: unknown) {
      throw handleError(<Error | AxiosError>err, this.baseUrl + route);
    }
  }
}
