'use strict';
/**
 * Pure in-memory store — no downloads needed.
 * Mimics the Mongoose Model API used by the controllers.
 */
const { randomBytes } = require('crypto');

function newId() { return randomBytes(12).toString('hex'); }

// Safe clone that avoids JSON.stringify calling toJSON on the object itself
function safeClone(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(safeClone);
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] !== 'function') out[k] = safeClone(obj[k]);
    }
    return out;
  }
  return obj;
}

function getDeep(obj, path) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function matchQuery(doc, query) {
  if (!query || !Object.keys(query).length) return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or')  { if (!val.some(s => matchQuery(doc, s))) return false; continue; }
    if (key === '$and') { if (!val.every(s => matchQuery(doc, s))) return false; continue; }
    const dv = getDeep(doc, key);
    if (val === null || val === undefined) {
      if (dv !== null && dv !== undefined) return false;
    } else if (typeof val === 'object' && !Array.isArray(val) && val.constructor === Object) {
      for (const [op, ov] of Object.entries(val)) {
        if (op === '$gt'  && !(dv >  ov)) return false;
        if (op === '$gte' && !(dv >= ov)) return false;
        if (op === '$lt'  && !(dv <  ov)) return false;
        if (op === '$lte' && !(dv <= ov)) return false;
        if (op === '$ne'  && String(dv) === String(ov)) return false;
        if (op === '$in'  && !ov.map(String).includes(String(dv))) return false;
        if (op === '$nin' &&  ov.map(String).includes(String(dv))) return false;
      }
    } else {
      if (String(dv) !== String(val)) return false;
    }
  }
  return true;
}

function applyUpdate(raw, update) {
  if (!Object.keys(update).some(k => k.startsWith('$'))) {
    Object.assign(raw, safeClone(update));
    return;
  }
  if (update.$set)    Object.entries(update.$set).forEach(([k,v]) => setDeep(raw, k, v));
  if (update.$unset)  Object.keys(update.$unset).forEach(k => delete raw[k]);
  if (update.$inc)    Object.entries(update.$inc).forEach(([k,v]) => setDeep(raw, k, (getDeep(raw, k) || 0) + v));
  if (update.$push)   Object.entries(update.$push).forEach(([k,v]) => { if (!Array.isArray(getDeep(raw,k))) setDeep(raw,k,[]); getDeep(raw,k).push(v); });
  if (update.$pull)   Object.entries(update.$pull).forEach(([k,v]) => { const a=getDeep(raw,k); if (Array.isArray(a)) setDeep(raw,k,a.filter(i=>!matchQuery(i,v))); });
  if (update.$addToSet) Object.entries(update.$addToSet).forEach(([k,v]) => { const a=getDeep(raw,k)||[]; if(!a.includes(v)) a.push(v); setDeep(raw,k,a); });
}

// Wraps a single doc promise so .select() / .populate() chains work
class DocChain {
  constructor(docPromise) { this._p = docPromise; }
  select()   { return this; }
  populate() { return this; }
  lean()     { return this; }
  then(res, rej) { return this._p.then(res, rej); }
}

class QueryChain {
  constructor(items) { this._items = items; this._sortBy = null; this._skip = 0; this._limit = Infinity; }
  select()    { return this; }
  populate()  { return this; }
  lean()      { return this; }
  sort(s)     { this._sortBy = s; return this; }
  skip(n)     { this._skip = n;  return this; }
  limit(n)    { this._limit = n; return this; }
  _resolve() {
    let r = [...this._items];
    if (this._sortBy) {
      const es = Object.entries(this._sortBy);
      r.sort((a, b) => {
        for (const [k, d] of es) {
          const av = getDeep(a._raw, k), bv = getDeep(b._raw, k);
          if (av < bv) return d === -1 ? 1 : -1;
          if (av > bv) return d === -1 ? -1 : 1;
        }
        return 0;
      });
    }
    return r.slice(this._skip, this._skip === 0 && this._limit === Infinity ? undefined : this._skip + this._limit);
  }
  then(res, rej) { return Promise.resolve(this._resolve()).then(res, rej); }
}

function makeModel(name, defaults = {}, hooks = {}) {
  const store = new Map(); // id -> raw plain object

  function wrapDoc(raw) {
    // doc is a thin proxy that keeps _raw separate to avoid JSON.stringify loop
    const doc = Object.create(null);
    doc._raw = raw; // mutable reference to the store's data

    // Forward plain field access to _raw
    Object.keys(raw).forEach(k => {
      if (!(k in doc)) {
        Object.defineProperty(doc, k, {
          get: () => doc._raw[k],
          set: (v) => { doc._raw[k] = v; },
          enumerable: true, configurable: true
        });
      }
    });

    doc.id = String(raw._id);

    doc.toObject = () => safeClone(raw);
    doc.toJSON   = () => safeClone(raw); // safe — safeClone doesn't call .toJSON

    doc.save = async () => {
      raw.updatedAt = new Date();
      if (hooks.preSave) await hooks.preSave(raw);
      store.set(String(raw._id), raw);
      return doc;
    };

    if (hooks.afterWrap) hooks.afterWrap(doc);
    return doc;
  }

  class Model {
    static get modelName() { return name; }

    static async create(data) {
      const raw = Object.assign({}, safeClone(defaults), safeClone(data));
      raw._id        = raw._id       || newId();
      raw.createdAt  = raw.createdAt  || new Date();
      raw.updatedAt  = new Date();
      if (hooks.preSave) await hooks.preSave(raw);
      store.set(String(raw._id), raw);
      return wrapDoc(raw);
    }

    static find(query = {}) {
      const docs = [...store.values()]
        .filter(r => matchQuery(r, query))
        .map(r => wrapDoc(r));
      return new QueryChain(docs);
    }

    static findOne(query = {}) {
      const p = Promise.resolve(
        (r => r ? wrapDoc(r) : null)([...store.values()].find(r => matchQuery(r, query)))
      );
      return new DocChain(p);
    }

    static findById(id) {
      const p = Promise.resolve(
        id ? (r => r ? wrapDoc(r) : null)(store.get(String(id))) : null
      );
      return new DocChain(p);
    }

    static findByIdAndUpdate(id, update, opts = {}) {
      const p = Promise.resolve().then(() => {
        if (!id) return null;
        const r = store.get(String(id));
        if (!r) return null;
        applyUpdate(r, update);
        r.updatedAt = new Date();
        return wrapDoc(r);
      });
      return new DocChain(p);
    }

    static async findOneAndUpdate(query, update, opts = {}) {
      const r = [...store.values()].find(r => matchQuery(r, query));
      if (!r) { if (opts.upsert) return Model.create(update.$set || update); return null; }
      applyUpdate(r, update);
      r.updatedAt = new Date();
      return wrapDoc(r);
    }

    static async findByIdAndDelete(id) {
      if (!id) return null;
      const r = store.get(String(id));
      if (r) store.delete(String(id));
      return r ? wrapDoc(r) : null;
    }

    static async findOneAndDelete(query = {}) {
      for (const [k, r] of store) {
        if (matchQuery(r, query)) { store.delete(k); return wrapDoc(r); }
      }
      return null;
    }

    static async countDocuments(query = {}) {
      return [...store.values()].filter(r => matchQuery(r, query)).length;
    }

    static async deleteMany(query = {}) {
      let n = 0;
      for (const [k, r] of store) { if (matchQuery(r, query)) { store.delete(k); n++; } }
      return { deletedCount: n };
    }

    static async aggregate(pipeline) {
      let docs = [...store.values()].map(r => safeClone(r));
      for (const stage of pipeline) {
        if (stage.$match) {
          docs = docs.filter(d => matchQuery(d, stage.$match));
        }
        if (stage.$unwind) {
          const field = (stage.$unwind.path || stage.$unwind).replace('$', '');
          const preserve = stage.$unwind.preserveNullAndEmptyArrays;
          const out = [];
          for (const d of docs) {
            const arr = d[field];
            if (!arr || (Array.isArray(arr) && !arr.length)) { if (preserve) out.push(d); }
            else if (Array.isArray(arr)) arr.forEach(item => out.push({ ...d, [field]: item }));
            else out.push(d);
          }
          docs = out;
        }
        if (stage.$group) {
          const map = new Map();
          for (const d of docs) {
            const gIdExpr = stage.$group._id;
            let key;
            if (!gIdExpr) key = '__all__';
            else if (typeof gIdExpr === 'string') key = String(getDeep(d, gIdExpr.replace('$', '')) ?? '__all__');
            else key = '__all__';
            if (!map.has(key)) map.set(key, { _id: key === '__all__' ? null : key });
            const g = map.get(key);
            for (const [f, agg] of Object.entries(stage.$group)) {
              if (f === '_id') continue;
              if (agg.$sum !== undefined) {
                const v = typeof agg.$sum === 'number' ? agg.$sum : (getDeep(d, agg.$sum.replace('$','')) || 0);
                g[f] = (g[f] || 0) + v;
              }
              if (agg.$avg !== undefined) {
                const v = getDeep(d, agg.$avg.replace('$','')) || 0;
                g[`__s_${f}`] = (g[`__s_${f}`] || 0) + v;
                g[`__c_${f}`] = (g[`__c_${f}`] || 0) + 1;
              }
              if (agg.$first !== undefined && g[f] === undefined) {
                g[f] = getDeep(d, agg.$first.replace('$',''));
              }
            }
          }
          docs = [...map.values()].map(g => {
            for (const k of Object.keys(g).filter(k => k.startsWith('__s_'))) {
              const f = k.slice(4);
              g[f] = g[`__s_${f}`] / (g[`__c_${f}`] || 1);
              delete g[`__s_${f}`]; delete g[`__c_${f}`];
            }
            return g;
          });
        }
        if (stage.$sort) {
          const es = Object.entries(stage.$sort);
          docs.sort((a,b) => { for (const [k,d] of es) { const av=a[k],bv=b[k]; if(av<bv) return d===-1?1:-1; if(av>bv) return d===-1?-1:1; } return 0; });
        }
        if (stage.$limit) docs = docs.slice(0, stage.$limit);
        if (stage.$skip)  docs = docs.slice(stage.$skip);
      }
      return docs;
    }
  }

  return Model;
}

module.exports = { makeModel, newId };
