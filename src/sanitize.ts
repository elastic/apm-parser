/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import _ from "lodash";
import { Events, SpanRaw, TransactionRaw } from "./types";
import { URL } from "url";

const isTransaction = (x: Events): x is TransactionRaw => {
  return x.processor.name === 'transaction' && x.processor.event === 'transaction';
};

const isSpan = (x: Events): x is SpanRaw => {
  return x.processor.name === 'transaction' && x.processor.event === 'span';
};

export const scalability = (e: Events) => {
  if (!isSpan(e) && !isTransaction(e)) { return }

  const t = _.omit(_.pick(e, ['@timestamp', 'http', 'transaction', 'span', 'parent']), 'http.version')

  if (e.transaction) {
    _.set(t, 'transaction_id', _.get(e, 'transaction.id'))
  }
  if (e.span) {
    _.set(t, 'span_id', _.get(e, 'span.id', ''))
  }
  if (e.parent) {
    _.set(t, 'parent_id', _.get(e, 'parent.id', ''))
  }
  if (e.url) {
    _.set(t, 'url_path', _.get(e, 'url.path', ''))
    _.set(t, 'url_base', _.get(e, 'url.full') ? new URL(_.get(e, 'url.full')).origin : '')
  }

  return _.omit(t, ['transaction', 'span', 'parent', 'url'])
}

/*
const isMetric = (x: Events): x is MetricRaw => {
  return x.processor.name === 'metric' && x.processor.event === 'metric';
};

const isError = (x: Events): x is ErrorRaw => {
  return x.processor.name === 'error' && x.processor.event === 'error';
};
*/
