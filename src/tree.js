"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
exports.default = (function (traceDocs) {
    var getId = function (el) { return (el.span ? el.span.id : el.transaction.id); };
    var idMapping = traceDocs.reduce(function (acc, el, i) {
        acc[getId(el)] = i;
        return acc;
    }, {});
    var root = {};
    traceDocs.forEach(function (el) {
        if (!el.parent) {
            root = el;
            return;
        }
        if (!traceDocs[idMapping[el.parent.id]]) {
            return;
        }
        var parentEl = traceDocs[idMapping[el.parent.id]];
        parentEl.children = (0, tslib_1.__spreadArray)((0, tslib_1.__spreadArray)([], (parentEl.children || []), true), [el], false);
    });
    return root;
});
//# sourceMappingURL=tree.js.map