export default (traceDocs) => {
  const getId = (el) => (el.span ? el.span.id : el.transaction.id);
  const idMapping = traceDocs.reduce((acc, el, i) => {
    acc[getId(el)] = i;
    return acc;
  }, {});

  let root = {};
  traceDocs.forEach((el) => {
    if (!el.parent) {
      root = el;
      return;
    }
    if (!traceDocs[idMapping[el.parent.id]]) {
      return;
    }
    const parentEl = traceDocs[idMapping[el.parent.id]];
    parentEl.children = [...(parentEl.children || []), el];
  });

  return root;
};
