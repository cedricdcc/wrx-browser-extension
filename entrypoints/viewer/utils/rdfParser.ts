import { Parser, Quad, DataFactory } from 'n3';
import jsonld from 'jsonld';

const { namedNode, literal, blankNode, quad } = DataFactory;

// Strip remote context URLs from JSON-LD to prevent remote fetch failures in sandboxed environments
export const stripRemoteContextUrls = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripRemoteContextUrls);
  const jsonObj = obj as Record<string, any>;
  if (typeof jsonObj['@context'] === 'string') {
    return { ...jsonObj, '@context': {} };
  }
  if (typeof jsonObj['@context'] === 'object') {
    return { ...jsonObj, '@context': stripRemoteContextUrls(jsonObj['@context']) };
  }
  return jsonObj;
};

// Safe JSON-LD to RDF Quads parser
export const parseJsonLd = async (contentStr: string, baseIRI: string): Promise<Quad[]> => {
  const parsedJson = JSON.parse(contentStr);
  try {
    const nquads = await jsonld.toRDF(parsedJson, {
      format: 'application/n-quads',
      base: baseIRI
    });
    const parser = new Parser({ format: 'N-Quads', baseIRI });
    return parser.parse(String(nquads));
  } catch (err) {
    // Robust fallback: strip remote context URLs and retry
    const safeParsed = stripRemoteContextUrls(parsedJson);
    const nquads = await jsonld.toRDF(safeParsed, {
      format: 'application/n-quads',
      base: baseIRI
    });
    const parser = new Parser({ format: 'N-Quads', baseIRI });
    return parser.parse(String(nquads));
  }
};

// Convert WRX web-link relations (extend-link) into structured RDF Quads
export const convertRelationsToQuads = (relations: any[], sourceUri: string): Quad[] => {
  const quads: Quad[] = [];
  const xhtml = 'http://www.w3.org/1999/xhtml#';
  const rdfType = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

  for (const relation of relations) {
    const subject = blankNode();

    quads.push(quad(subject, rdfType, namedNode(`${xhtml}link`)));
    quads.push(quad(subject, namedNode(`${xhtml}anchor`), namedNode(relation.anchor ?? relation.href)));

    const isRelAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(relation.rel);
    quads.push(quad(
      subject,
      namedNode(`${xhtml}rel`),
      isRelAbsolute ? namedNode(relation.rel) : literal(relation.rel)
    ));

    quads.push(quad(subject, namedNode(`${xhtml}href`), namedNode(relation.href)));

    const options = relation.options ?? [];
    for (const option of options) {
      const optionNode = blankNode();
      quads.push(quad(subject, namedNode(`${xhtml}option`), optionNode));
      quads.push(quad(optionNode, rdfType, namedNode(`${xhtml}LinkOption`)));
      quads.push(quad(optionNode, namedNode(`${xhtml}optionKey`), literal(option.name ?? '')));
      quads.push(quad(optionNode, namedNode(`${xhtml}optionVal`), literal(option.value ?? '')));
    }

    if (options.length === 0) {
      quads.push(quad(subject, namedNode(`${xhtml}option`), blankNode()));
    }
  }

  return quads;
};

// RDF Quad serialization for sessionStorage persistence
export const serializeQuads = (quads: Quad[]): any[] => {
  return quads.map(q => ({
    subject: { termType: q.subject.termType, value: q.subject.value },
    predicate: { termType: q.predicate.termType, value: q.predicate.value },
    object: { 
      termType: q.object.termType, 
      value: q.object.value,
      datatype: q.object.termType === 'Literal' ? q.object.datatype?.value : undefined,
      language: q.object.termType === 'Literal' ? q.object.language : undefined
    },
    graph: { termType: q.graph.termType, value: q.graph.value }
  }));
};

// RDF Quad deserialization from plain JSON structures
export const deserializeQuads = (plain: any[]): Quad[] => {
  return plain.map(q => {
    let sub;
    if (q.subject.termType === 'NamedNode') sub = namedNode(q.subject.value);
    else if (q.subject.termType === 'BlankNode') sub = blankNode(q.subject.value);
    else sub = literal(q.subject.value);

    const pred = namedNode(q.predicate.value);

    let obj;
    if (q.object.termType === 'NamedNode') obj = namedNode(q.object.value);
    else if (q.object.termType === 'BlankNode') obj = blankNode(q.object.value);
    else {
      if (q.object.datatype) {
        obj = literal(q.object.value, namedNode(q.object.datatype));
      } else if (q.object.language) {
        obj = literal(q.object.value, q.object.language);
      } else {
        obj = literal(q.object.value);
      }
    }

    const gr = namedNode(q.graph?.value || '');

    return quad(sub, pred, obj, gr);
  });
};
