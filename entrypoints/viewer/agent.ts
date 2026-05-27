// agent.ts
// Autonomous LLM Exploration Agent with In-Memory SPARQL Engine and Dynamic SHACL Shapes.

import { Quad } from 'n3';

export interface AgentStep {
  id: string;
  timestamp: string;
  status: 'reasoning' | 'crawling' | 'integrating' | 'answering' | 'complete' | 'error' | 'sparql';
  thought: string;
  actionText: string;
  query?: string;
  queryResults?: string;
}

export interface AgentConfig {
  endpoint: string;
  apiKey: string;
  modelName: string;
  apiFormat: 'chat' | 'legacy';
  maxCalls: number;
}

export interface QueryHistoryLog {
  query: string;
  resultsCount: number;
  preview: string;
}

/**
 * Dynamically generates a structural SHACL shapes Turtle file representing the schema of the active Knowledge Graph.
 */
export const generateShaclShapes = (quads: Quad[]): string => {
  const rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  const xsdString = 'http://www.w3.org/2001/XMLSchema#string';
  const rdfsResource = 'http://www.w3.org/2000/01/rdf-schema#Resource';

  // 1. Map subjects to their explicit types
  const subjectTypes = new Map<string, Set<string>>();
  quads.forEach(q => {
    if (q.predicate.value === rdfType) {
      const types = subjectTypes.get(q.subject.value) || new Set<string>();
      types.add(q.object.value);
      subjectTypes.set(q.subject.value, types);
    }
  });

  // 2. Map targetClasses to their predicates and value types
  const classProperties = new Map<string, Map<string, Set<string>>>();
  quads.forEach(q => {
    if (q.predicate.value === rdfType) return; // Skip type quads

    const types = subjectTypes.get(q.subject.value);
    if (!types) return;

    types.forEach(cls => {
      const predMap = classProperties.get(cls) || new Map<string, Set<string>>();
      const valTypes = predMap.get(q.predicate.value) || new Set<string>();

      if (q.object.termType === 'Literal') {
        valTypes.add(q.object.datatype?.value || xsdString);
      } else if (q.object.termType === 'NamedNode') {
        const objTypes = subjectTypes.get(q.object.value);
        if (objTypes && objTypes.size > 0) {
          objTypes.forEach(t => valTypes.add(t));
        } else {
          valTypes.add(rdfsResource);
        }
      } else {
        valTypes.add(rdfsResource);
      }

      predMap.set(q.predicate.value, valTypes);
      classProperties.set(cls, predMap);
    });
  });

  // 3. Serialize to compact, readable Turtle SHACL shapes format
  let shacl = `# SHACL Shapes Schema of the harvested Knowledge Graph\n`;
  shacl += `@prefix sh: <http://www.w3.org/ns/shacl#> .\n`;
  shacl += `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n`;
  shacl += `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n`;
  shacl += `@prefix shapes: <http://example.org/shapes#> .\n\n`;

  if (classProperties.size === 0) {
    return shacl + `# (No structural schema harvested yet. Waiting for RDF triples...)`;
  }

  classProperties.forEach((predMap, cls) => {
    const clsLocal = cls.split('#').pop()?.split('/').pop() || 'Resource';
    shacl += `shapes:${clsLocal}Shape a sh:NodeShape ;\n`;
    shacl += `  sh:targetClass <${cls}> ;\n`;

    const propsList: string[] = [];
    predMap.forEach((valTypes, pred) => {
      const predLocal = pred.split('#').pop()?.split('/').pop() || 'property';
      let propText = `  sh:property [\n`;
      propText += `    sh:path <${pred}> ;\n`;

      const typeArray = Array.from(valTypes);
      const isLiteralType = typeArray.some(t => t.includes('XMLSchema') || t.includes('datatype'));
      
      if (isLiteralType) {
        const dtype = typeArray.find(t => t.includes('XMLSchema')) || xsdString;
        propText += `    sh:datatype <${dtype}> \n`;
      } else {
        const classTarget = typeArray.find(t => t !== rdfsResource && t !== rdfType);
        if (classTarget) {
          propText += `    sh:class <${classTarget}> \n`;
        } else {
          propText += `    sh:description "Links to resources" \n`;
        }
      }
      propText += `  ]`;
      propsList.push(propText);
    });

    shacl += propsList.join(" ;\n") + " .\n\n";
  });

  return shacl.trim();
};

/**
 * Normalizes tokens inside SPARQL patterns by stripping '<', '>', or double quotes.
 */
const normPat = (token: string): string => {
  let t = token.trim();
  if (t.startsWith('<') && t.endsWith('>')) return t.slice(1, -1);
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  return t;
};

/**
 * A high-performance local SPARQL SELECT query parser and BGP unification solver.
 */
export const executeLocalSparql = (query: string, quads: Quad[]): Record<string, string>[] => {
  try {
    const clean = query.replace(/\s+/g, ' ').trim();
    const selectMatch = clean.match(/SELECT\s+([\?\w\s\*]+)\s+WHERE\s*\{([\s\S]*)\}/i);
    
    if (!selectMatch) {
      throw new Error("Invalid query syntax. Supported format: SELECT ?var1 ?var2 WHERE { ?subj ?pred ?obj . }");
    }

    const varsStr = selectMatch[1].trim();
    let whereBlock = selectMatch[2].trim();
    
    if (whereBlock.endsWith('}')) {
      whereBlock = whereBlock.slice(0, -1).trim();
    }

    // Parse triple patterns
    const patterns = whereBlock
      .split('.')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(pattern => {
        const parts = pattern.split(/\s+/);
        if (parts.length < 3) {
          throw new Error(`Invalid BGP pattern format: "${pattern}"`);
        }
        return {
          sPat: parts[0],
          pPat: parts[1],
          oPat: parts.slice(2).join(' ')
        };
      });

    // Determine query variables
    let selectVars: string[] = [];
    if (varsStr === '*') {
      const allVars = new Set<string>();
      patterns.forEach(p => {
        if (p.sPat.startsWith('?')) allVars.add(p.sPat);
        if (p.pPat.startsWith('?')) allVars.add(p.pPat);
        if (p.oPat.startsWith('?')) allVars.add(p.oPat);
      });
      selectVars = Array.from(allVars);
    } else {
      selectVars = varsStr.match(/\?\w+/g) || [];
    }

    // Unification join solver loop
    let bindings: Record<string, string>[] = [{}];

    for (const { sPat, pPat, oPat } of patterns) {
      const nextBindings: Record<string, string>[] = [];

      for (const binding of bindings) {
        for (const q of quads) {
          const matchBinding = { ...binding };

          // 1. Unify Subject
          if (sPat.startsWith('?')) {
            if (matchBinding[sPat] !== undefined && matchBinding[sPat] !== q.subject.value) continue;
            matchBinding[sPat] = q.subject.value;
          } else {
            if (normPat(sPat) !== q.subject.value) continue;
          }

          // 2. Unify Predicate
          if (pPat.startsWith('?')) {
            if (matchBinding[pPat] !== undefined && matchBinding[pPat] !== q.predicate.value) continue;
            matchBinding[pPat] = q.predicate.value;
          } else {
            if (normPat(pPat) !== q.predicate.value) continue;
          }

          // 3. Unify Object
          if (oPat.startsWith('?')) {
            if (matchBinding[oPat] !== undefined && matchBinding[oPat] !== q.object.value) continue;
            matchBinding[oPat] = q.object.value;
          } else {
            if (normPat(oPat) !== q.object.value) continue;
          }

          nextBindings.push(matchBinding);
        }
      }

      bindings = nextBindings;
      if (bindings.length === 0) break; // Early short-circuit if joins yield zero bindings
    }

    // Project selected variables
    return bindings.map(b => {
      const projected: Record<string, string> = {};
      selectVars.forEach(v => {
        projected[v] = b[v] || 'NULL';
      });
      return projected;
    });

  } catch (err: any) {
    console.error("SPARQL solver error:", err);
    throw new Error(`SPARQL Execution Failed: ${err.message}`);
  }
};

export const parseAgentResponse = (text: string): { thought: string; action: 'crawl' | 'answer' | 'sparql'; query?: string; target?: string; answer?: string } => {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
      if (match) cleaned = match[1].trim();
    }
    
    try {
      return JSON.parse(cleaned);
    } catch {
      const objMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (objMatch) {
        return JSON.parse(objMatch[0]);
      }
      throw new Error("No JSON object discovered");
    }
  } catch (err) {
    console.warn("Failed to parse JSON response. raw:", text, err);
    return {
      thought: "Failed to parse structured JSON. Treating raw text as final answer.",
      action: 'answer',
      answer: text
    };
  }
};

export const getSystemPrompt = (): string => {
  return `You are "Antigravity Agent", an autonomous Semantic Web exploration agent.
Your objective is to answer the user's question by performing precise local SPARQL SELECT queries against our in-memory Knowledge Graph and selectively crawling targets.

Rather than reading the entire graph, you are guided by a dynamic SHACL Shapes file outlining the classes and properties in memory. You also maintain a Query History to remember what you have already queried.

Choose between three actions at each step:
1. "sparql": Run a SELECT query inside WHERE patterns to fetch specific triples, find links, or compile statistics.
   CRITICAL: Keep queries standard SELECT queries. Avoid complex SPARQL syntax.
2. "crawl": If your queries discover new HTTP/HTTPS resource links that are not yet crawled/visited, crawl the URI.
3. "answer": If the accumulated results of your queries fully solve the user's question, provide the detailed final answer.

Respond strictly in the following JSON format. Do not add any conversational text before or after the JSON block.

JSON Schema:
{
  "thought": "Your concise step-by-step reasoning on what we need next, checking what was already queried to prevent redundant operations.",
  "action": "sparql" | "crawl" | "answer",
  "query": "The standard SPARQL SELECT query string (MANDATORY if action is 'sparql', otherwise omit)",
  "target": "The absolute HTTP/HTTPS URI to crawl next (MANDATORY if action is 'crawl', otherwise omit)",
  "answer": "Your detailed final answer to the user's question, citing the query results (MANDATORY if action is 'answer', otherwise omit)"
}`;
};

export const getUserPrompt = (
  question: string,
  shaclShapes: string,
  visitedUris: string[],
  availableUris: string[],
  queryHistory: QueryHistoryLog[],
  currentCall: number,
  maxCalls: number
): string => {
  return `### User Question:
${question}

### Progress:
- WRX Crawler Calls Made: ${currentCall} of ${maxCalls} maximum.

### SHACL Schema Map of local Knowledge Graph:
\`\`\`turtle
${shaclShapes}
\`\`\`

### Resource Index:
- Visited resources:
${visitedUris.length > 0 ? visitedUris.map(uri => `  - <${uri}>`).join('\n') : "  - (None)"}
- Discovered crawlable URI frontier:
${availableUris.length > 0 ? availableUris.map(uri => `  - <${uri}>`).join('\n') : "  - (No new references discovered yet)"}

### SPARQL Query History & Results:
${queryHistory.length > 0 
  ? queryHistory.map((h, i) => `[Query #${i + 1}]
Query: ${h.query}
Results Bound: ${h.resultsCount} rows
Result Data:
${h.preview}`).join('\n\n')
  : "(No queries executed yet. Run a 'sparql' query tool first to gather targeted properties!)"}

Choose your next action (sparql, crawl, or answer) and respond strictly in JSON.`;
};

export const callLlmApi = async (
  config: AgentConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> => {
  const isChat = config.apiFormat === 'chat';
  const url = config.endpoint.trim() || 'http://localhost:8080/v1/chat/completions';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }
  
  let body: any;
  if (isChat) {
    body = {
      model: config.modelName.trim() || 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1
    };
  } else {
    body = {
      prompt: `${systemPrompt}\n\n### System Message:\nYou must output strictly in JSON.\n\n### Context:\n${userPrompt}\n\n### Response JSON:\n`,
      temperature: 0.1,
      n_predict: 1024
    };
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal
  });
  
  if (!response.ok) {
    throw new Error(`LLM Server returned error ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (isChat) {
    return data.choices?.[0]?.message?.content || '';
  } else {
    return data.content || data.choices?.[0]?.text || JSON.stringify(data);
  }
};
