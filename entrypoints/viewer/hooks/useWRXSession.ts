import { useState, useEffect, useRef } from 'react';
import { Quad, Parser, Writer, DataFactory } from 'n3';
import { extractRDF, extractLinkRelations } from '../wrx/wrx';
import { parseJsonLd, convertRelationsToQuads, serializeQuads, deserializeQuads } from '../utils/rdfParser';
import { normalizeTargetUrl, updateTargetHistory } from '../utils/url';

const { namedNode, quad } = DataFactory;

export interface UrnTrace {
  source: string;
  format: string;
  content: string;
  url: string;
  linkRelations: any[];
}

interface VisitedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
}

interface NavEdge {
  source: string;
  target: string;
  label: string;
}

export const useWRXSession = () => {
  const [triples, setTriples] = useState<Quad[]>(() => {
    const saved = sessionStorage.getItem('wrx_session_triples');
    if (saved) {
      try {
        return deserializeQuads(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved triples', e);
      }
    }
    return [];
  });

  const [visitedNodes, setVisitedNodes] = useState<VisitedNode[]>(() => {
    const saved = sessionStorage.getItem('wrx_session_visited_nodes');
    return saved ? JSON.parse(saved) : [];
  });

  const [navigationEdges, setNavigationEdges] = useState<NavEdge[]>(() => {
    const saved = sessionStorage.getItem('wrx_session_navigation_edges');
    return saved ? JSON.parse(saved) : [];
  });

  const [traces, setTraces] = useState<Record<string, UrnTrace>>(() => {
    const saved = sessionStorage.getItem('wrx_session_traces');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedUri, setSelectedUri] = useState<string>(() => {
    return sessionStorage.getItem('wrx_session_selected_uri') || '';
  });

  const [targetInput, setTargetInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  // References to keep async loop context 100% current and immune to stale React state closures
  const triplesRef = useRef(triples);
  const visitedNodesRef = useRef(visitedNodes);
  const navigationEdgesRef = useRef(navigationEdges);

  useEffect(() => { triplesRef.current = triples; }, [triples]);
  useEffect(() => { visitedNodesRef.current = visitedNodes; }, [visitedNodes]);
  useEffect(() => { navigationEdgesRef.current = navigationEdges; }, [navigationEdges]);

  // Sync state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('wrx_session_triples', JSON.stringify(serializeQuads(triples)));
    } catch (e) {
      console.warn('sessionStorage quota exceeded for wrx_session_triples', e);
      setError('Session storage quota exceeded. The knowledge graph is too large to persist on page reload, but will remain fully active in-memory!');
    }
  }, [triples]);

  useEffect(() => {
    try {
      sessionStorage.setItem('wrx_session_visited_nodes', JSON.stringify(visitedNodes));
    } catch (e) {
      console.warn('Failed to sync visitedNodes to sessionStorage', e);
    }
  }, [visitedNodes]);

  useEffect(() => {
    try {
      sessionStorage.setItem('wrx_session_navigation_edges', JSON.stringify(navigationEdges));
    } catch (e) {
      console.warn('Failed to sync navigationEdges to sessionStorage', e);
    }
  }, [navigationEdges]);

  useEffect(() => {
    try {
      sessionStorage.setItem('wrx_session_traces', JSON.stringify(traces));
    } catch (e) {
      console.warn('Failed to sync traces to sessionStorage', e);
    }
  }, [traces]);

  useEffect(() => {
    try {
      sessionStorage.setItem('wrx_session_selected_uri', selectedUri);
    } catch (e) {
      console.warn('Failed to sync selectedUri to sessionStorage', e);
    }
  }, [selectedUri]);

  // Cascading Discovery & Navigation Graph Construction
  const fetchSemanticData = async (url: string, parentUri: string | null = null, relLabel: string = 'explore') => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch RDF cascadingly using WRX
      const rdfResult = await extractRDF(url);
      
      let parsedQuads: Quad[] = [];
      let finalUrl = url;

      if (rdfResult) {
        finalUrl = rdfResult.url || url;
        const format = (rdfResult.format || '').toLowerCase();
        
        if (format.includes('jsonld') || format.includes('json')) {
          parsedQuads = await parseJsonLd(rdfResult.content, finalUrl);
        } else if (
          format.includes('turtle') ||
          format.includes('trig') ||
          format.includes('ntriples') ||
          format.includes('nquads') ||
          format.includes('n3')
        ) {
          const parser = new Parser({ baseIRI: finalUrl });
          parsedQuads = parser.parse(rdfResult.content);
        } else {
          // Fallback parsing (attempt Turtle parser)
          try {
            const parser = new Parser({ baseIRI: finalUrl });
            parsedQuads = parser.parse(rdfResult.content);
          } catch {
            console.warn('Unable to parse raw payload directly in browser. RDF format:', format);
          }
        }
      }

      // 2. Fetch extend-link web-link relations using WRX
      const extractedRelations = await extractLinkRelations(url);

      // 3. Convert relations to quads
      let combinedQuads = [...parsedQuads];
      if (extractedRelations && extractedRelations.length > 0) {
        const relationQuads = convertRelationsToQuads(extractedRelations, finalUrl);
        combinedQuads = [...combinedQuads, ...relationQuads];
      }

      // 4. Update the traces directory dynamically per URI
      setTraces(prev => ({
        ...prev,
        [url]: {
          source: rdfResult?.source || 'Only Web Links',
          format: rdfResult?.format || 'N/A',
          content: rdfResult?.content || '',
          url: finalUrl,
          linkRelations: extractedRelations || []
        }
      }));

      // 5. Associate quads with their source graph URL and accumulate avoiding duplicates
      const quadsWithSource = combinedQuads.map(q => {
        return quad(q.subject, q.predicate, q.object, namedNode(url));
      });

      setTriples(prev => {
        const unique = [...prev];
        quadsWithSource.forEach(q => {
          if (!unique.some(eq => eq.subject.value === q.subject.value && eq.predicate.value === q.predicate.value && eq.object.value === q.object.value && eq.graph.value === q.graph.value)) {
            unique.push(q);
          }
        });
        return unique;
      });

      // 6. Append to visited nodes
      if (url) {
        setVisitedNodes(prev => {
          if (prev.some(node => node.id === url)) return prev;
          return [...prev, { id: url, label: url, x: 300, y: 175, depth: 0 }];
        });
      }

      if (parentUri && parentUri !== url) {
        setNavigationEdges(prev => {
          if (prev.some(edge => edge.source === parentUri && edge.target === url)) return prev;
          return [...prev, { source: parentUri, target: url, label: relLabel }];
        });
      }

      // 7. Auto-populate discovered signposted link relations (extend-links) as nodes & edges
      if (extractedRelations && extractedRelations.length > 0) {
        extractedRelations.forEach(rel => {
          const targetHref = rel.href;
          if (targetHref && (targetHref.startsWith('http://') || targetHref.startsWith('https://'))) {
            setVisitedNodes(prev => {
              if (prev.some(node => node.id === targetHref)) return prev;
              return [...prev, { id: targetHref, label: targetHref, x: 300, y: 175, depth: 0 }];
            });

            setNavigationEdges(prev => {
              if (prev.some(edge => edge.source === url && edge.target === targetHref && edge.label === rel.rel)) return prev;
              return [...prev, { source: url, target: targetHref, label: rel.rel }];
            });
          }
        });
      }

      if (!rdfResult && (!extractedRelations || extractedRelations.length === 0)) {
        throw new Error('No RDF content or web-link relations discovered for this URI.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve semantic triples.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Self-bootstrapping effect for handling initial URI crawl parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('target');

    if (targetUrl) {
      const normalized = normalizeTargetUrl(targetUrl);
      if (normalized) {
        setTargetInput(normalized);
        setSelectedUri(normalized);
        
        // Only fetch if we have not crawled this node in this session
        const alreadyVisited = visitedNodesRef.current.some(n => n.id === normalized);
        if (!alreadyVisited) {
          setVisitedNodes(prev => {
            if (prev.some(node => node.id === normalized)) return prev;
            return [...prev, { id: normalized, label: normalized, x: 300, y: 175, depth: 0 }];
          });
          fetchSemanticData(normalized, null, 'seed');
        } else {
          setLoading(false);
        }
      } else {
        setError('Invalid target URL provided in parameter.');
        setLoading(false);
      }
    } else if (selectedUri) {
      // Restore from sessionStorage target if query param is not set
      setTargetInput(selectedUri);
      setLoading(false);
    } else {
      setError('No target URL provided. Enter a URI above to begin exploring.');
      setLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTargetUrl(targetInput);
    if (!normalized) {
      setError('Please provide a valid HTTP/HTTPS URI.');
      return;
    }
    
    // Add standalone root if not already in graph
    setVisitedNodes(prev => {
      if (prev.some(node => node.id === normalized)) return prev;
      return [...prev, { id: normalized, label: normalized, x: 300, y: 175, depth: 0 }];
    });

    const parent = selectedUri || null;
    setSelectedUri(normalized);
    updateTargetHistory(normalized);
    fetchSemanticData(normalized, parent, 'explore');
  };

  const handleNodeClick = (uri: string, relationLabel: string = 'describedby') => {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const parent = selectedUri;
      setTargetInput(uri);
      setSelectedUri(uri);
      updateTargetHistory(uri);

      // If URI was never visited, fetch its triples and append
      if (!visitedNodes.some(node => node.id === uri)) {
        fetchSemanticData(uri, parent, relationLabel);
      } else {
        // If already visited, just focus in-place and link
        setNavigationEdges(prev => {
          if (prev.some(edge => edge.source === parent && edge.target === uri)) return prev;
          return [...prev, { source: parent, target: uri, label: relationLabel }];
        });
      }
    }
  };

  const handleNodeSelect = (uri: string) => {
    setSelectedUri(uri);
    setTargetInput(uri);
    updateTargetHistory(uri);
  };

  const handleDownloadTurtle = async () => {
    if (triples.length === 0) return;
    setDownloading(true);

    try {
      const writer = new Writer({
        prefixes: {
          rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
          rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
          xhtml: 'http://www.w3.org/1999/xhtml#',
          schema: 'http://schema.org/',
          dcat: 'http://www.w3.org/ns/dcat#',
          dcterms: 'http://purl.org/dc/terms/'
        }
      });

      writer.addQuads(triples);
      
      writer.end((error, result) => {
        if (error) {
          setError('Failed to serialize knowledge graph to Turtle.');
          setDownloading(false);
          return;
        }

        const blob = new Blob([result], { type: 'text/turtle;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wrx-accumulated-graph.ttl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloading(false);
      });
    } catch {
      setError('Failed to export complete session graph.');
      setDownloading(false);
    }
  };

  const handleResetSession = () => {
    if (window.confirm('Are you sure you want to reset the current session and clear all harvested knowledge?')) {
      sessionStorage.clear();
      setTriples([]);
      setVisitedNodes([]);
      setNavigationEdges([]);
      setTraces({});
      setSelectedUri('');
      setTargetInput('');
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('target');
      window.history.pushState({ path: newUrl.toString() }, '', newUrl.toString());
    }
  };

  return {
    triples,
    visitedNodes,
    navigationEdges,
    traces,
    selectedUri,
    targetInput,
    error,
    loading,
    downloading,
    triplesRef,
    visitedNodesRef,
    navigationEdgesRef,
    setTargetInput,
    setSelectedUri,
    setError,
    setLoading,
    setVisitedNodes,
    setTriples,
    setNavigationEdges,
    fetchSemanticData,
    handleSearchSubmit,
    handleNodeClick,
    handleNodeSelect,
    handleDownloadTurtle,
    handleResetSession
  };
};
