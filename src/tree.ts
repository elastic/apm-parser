import _ from "lodash";

type TraceDoc = {
  '@timestamp': string;
  span_id: string;
  transaction_id: string;
  trace_id: string;
  parent_id: string;
  children: TraceDoc;
  http: Record<string, string>
}

export default (traceDocs: TraceDoc[]) => {
  const getId = (el) => (el.span_id ? el.span_id : el.transaction_id);

  const idMapping = traceDocs.reduce((acc, el, i) => {
    acc[getId(el)] = i;
    return acc;
  }, {});

  let root = {};
  traceDocs.forEach((el) => {
    if (!el.parent_id) {
      root = el;
      return;
    }

    const parentEl = traceDocs[idMapping[el.parent_id]];

    const children = _.concat(_.get(parentEl, 'children', []), el);
    _.set(parentEl, 'children', children)
  });

  return root;
};
