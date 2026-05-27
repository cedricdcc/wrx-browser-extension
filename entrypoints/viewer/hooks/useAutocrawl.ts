import { useState, useRef, useEffect } from 'react';
import { Quad, Parser } from 'n3';
import { extractRDF, extractLinkRelations } from '../wrx/wrx';
import { parseJsonLd, convertRelationsToQuads } from '../utils/rdfParser';

export interface AutocrawlNode {
  id: string;
  label: string;
  pageRank: number;
  type: 'html' | 'semantic';
  harvested: boolean;
  inDegree: number;
  outDegree: number;
  depth: number; // Discovery depth hop distance from seed
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface AutocrawlEdge {
  source: string;
  target: string;
  label: string;
  type: 'link' | 'triple';
}

export type AutocrawlPhase = 'idle' | 'html-crawling' | 'html-complete' | 'semantic-harvesting' | 'semantic-complete';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'that', 'this',
  'these', 'those', 'it', 'its', 'they', 'them', 'their', 'he', 'him', 'his', 'she', 'her',
  'we', 'us', 'our', 'you', 'your', 'i', 'me', 'my', 'have', 'has', 'had', 'do', 'does', 'did',
  'not', 'no', 'yes', 'as', 'if', 'then', 'else', 'than', 'so', 'can', 'will', 'should', 'would'
]);

const executeDomScraper = async (tabId: number): Promise<string | null> => {
  return new Promise(resolve => {
    try {
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => document.documentElement.outerHTML
        }, (results) => {
          resolve(results?.[0]?.result || null);
        });
      } else if (typeof chrome !== 'undefined' && chrome.tabs && (chrome.tabs as any).executeScript) {
        (chrome.tabs as any).executeScript(tabId, { code: 'document.documentElement.outerHTML' }, (results: any[]) => {
          resolve(results?.[0] || null);
        });
      } else if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.tabs && (globalThis as any).browser.tabs.executeScript) {
        (globalThis as any).browser.tabs.executeScript(tabId, { code: 'document.documentElement.outerHTML' }).then((results: any[]) => {
          resolve(results?.[0] || null);
        }).catch(() => resolve(null));
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
};

const crawlViaBackgroundTab = async (url: string, log: (msg: string) => void, crawlDelay: number): Promise<string | null> => {
  return new Promise(resolve => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        log(`[SPA] Spawning hidden background browser tab for URN - <${url}>`);
        chrome.tabs.create({ url, active: false }, (tab) => {
          if (!tab || tab.id === undefined) {
            resolve(null);
            return;
          }

          const tabId = tab.id;
          
          const listener = (changeTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (changeTabId === tabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              
              log(`[SPA] HTML loaded completely. Pacing 1.5s for script executions...`);
              setTimeout(async () => {
                const html = await executeDomScraper(tabId);
                chrome.tabs.remove(tabId);
                resolve(html);
              }, 1500);
            }
          };

          chrome.tabs.onUpdated.addListener(listener);

          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.remove(tabId, () => {});
            resolve(null);
          }, 12000);
        });
      } else {
        resolve(null);
      }
    } catch (e: any) {
      log(`[SPA ERROR] Background tab scraping failed: ${e.message}`);
      resolve(null);
    }
  });
};

export const useAutocrawl = (
  globalTriples: Quad[],
  setGlobalTriples: React.Dispatch<React.SetStateAction<Quad[]>>,
  setGlobalVisitedNodes: React.Dispatch<React.SetStateAction<any[]>>,
  setGlobalNavigationEdges: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [currentPhase, setCurrentPhase] = useState<AutocrawlPhase>('idle');
  const [crawlLog, setCrawlLog] = useState<string[]>([]);
  const [nodes, setNodes] = useState<AutocrawlNode[]>([]);
  const [edges, setEdges] = useState<AutocrawlEdge[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [crawlDelay, setCrawlDelay] = useState<number>(1000);
  const [keywordCloud, setKeywordCloud] = useState<Record<string, number>>({});
  const [useTabRendering, setUseTabRendering] = useState<boolean>(true);
  
  // Dynamic search depth slider state (changeable from 2 to 5 depth)
  const [maxDepth, setMaxDepth] = useState<number>(3);

  const log = (message: string) => {
    setCrawlLog(prev => [...prev, message]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const extractWordsFromText = (text: string, currentFreq: Record<string, number>) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
    const tokens = clean.split(/\s+/);
    tokens.forEach(tok => {
      const trimmed = tok.trim();
      if (trimmed.length > 3 && !STOP_WORDS.has(trimmed) && !/^\d+$/.test(trimmed)) {
        currentFreq[trimmed] = (currentFreq[trimmed] || 0) + 1;
      }
    });
  };

  // Personalized PageRank Solver in relation to original seed link
  const computePageRank = (currentNodes: AutocrawlNode[], currentEdges: AutocrawlEdge[], seedUrl: string) => {
    const N = currentNodes.length;
    if (N === 0) return currentNodes;

    const d = 0.85; // Damping factor
    const iterations = 25;
    
    // Initialize ranks
    let ranks: Record<string, number> = {};
    currentNodes.forEach(node => {
      ranks[node.id] = 1 / N;
    });

    const outLinks: Record<string, string[]> = {};
    currentNodes.forEach(node => {
      outLinks[node.id] = [];
    });
    currentEdges.forEach(edge => {
      if (outLinks[edge.source]) {
        outLinks[edge.source].push(edge.target);
      }
    });

    for (let iter = 0; iter < iterations; iter++) {
      let nextRanks: Record<string, number> = {};
      currentNodes.forEach(node => {
        nextRanks[node.id] = 0;
      });

      let sinkSum = 0;
      currentNodes.forEach(node => {
        const outs = outLinks[node.id];
        if (outs.length === 0) {
          sinkSum += ranks[node.id];
        } else {
          const share = ranks[node.id] / outs.length;
          outs.forEach(target => {
            if (nextRanks[target] !== undefined) {
              nextRanks[target] += share;
            }
          });
        }
      });

      // PERSONALIZATION: Sinks and damping factor are distributed 100% back to the seed URN!
      currentNodes.forEach(node => {
        const isSeed = node.id === seedUrl;
        nextRanks[node.id] = 
          (isSeed ? (1 - d) : 0) + 
          (isSeed ? (d * sinkSum) : 0) + 
          (d * nextRanks[node.id]);
      });

      ranks = nextRanks;
    }

    return currentNodes.map(node => {
      const inDegree = currentEdges.filter(e => e.target === node.id).length;
      const outDegree = currentEdges.filter(e => e.source === node.id).length;
      return {
        ...node,
        pageRank: ranks[node.id] || 0,
        inDegree,
        outDegree
      };
    });
  };

  // Smart sequential fetch wrapper with 3 retries, exponential backoffs, and 429 auto-cooldowns
  const fetchWithRetriesAndCooldowns = async (url: string, useTab: boolean, attempt: number = 1): Promise<string> => {
    try {
      if (useTab) {
        const html = await crawlViaBackgroundTab(url, log, crawlDelay);
        if (html) return html;
        throw new Error('Background tab scraper yielded empty content shell');
      }

      const response = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
      
      // Auto-cooldown for HTTP 429 Rate Limiting
      if (response.status === 429) {
        log(`[WARN] HTTP 429 Rate Limited on <${url}>. Initiating 5-second backoff and auto-increasing delay...`);
        setCrawlDelay(prev => Math.min(prev + 500, 3000)); // Increase base delay incrementally
        await sleep(5000);
        if (attempt <= 3) {
          log(`[RETRY] Re-attempting crawl [${attempt}/3] for <${url}>...`);
          return fetchWithRetriesAndCooldowns(url, useTab, attempt + 1);
        }
        throw new Error('Rate limit cutoff breached after max retries');
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      return response.text();

    } catch (err: any) {
      if (attempt <= 3) {
        const backoff = crawlDelay * attempt;
        log(`[RETRY] Fetch failed for <${url}>: ${err.message}. Retrying in ${backoff}ms [${attempt}/3]...`);
        await sleep(backoff);
        return fetchWithRetriesAndCooldowns(url, useTab, attempt + 1);
      }
      throw err;
    }
  };

  // Phase 1: BFS HTML web page crawler
  const runHtmlCrawl = async (seedUrl: string) => {
    setCurrentPhase('html-crawling');
    setCrawlLog([]);
    setNodes([]);
    setEdges([]);
    setKeywordCloud({});
    setProgress({ current: 0, total: 1 });
    
    log(`[INFO] Phase 1 BFS HTML Crawler initialized targeting seed webpage - <${seedUrl}>`);
    log(`[SETTINGS] Depth Limit: ${maxDepth} | Crawl Delay: ${crawlDelay}ms | Tab Emulator: ${useTabRendering ? 'ENABLED' : 'DISABLED'}`);

    const visited = new Set<string>();
    const localEdges: AutocrawlEdge[] = [];
    const localNodesMap = new Map<string, AutocrawlNode>();
    const localKeywordFreq: Record<string, number> = {};
    
    // Seed Node
    localNodesMap.set(seedUrl, {
      id: seedUrl,
      label: seedUrl,
      pageRank: 1.0,
      type: 'html',
      harvested: false,
      inDegree: 0,
      outDegree: 0,
      depth: 0 // Original seed node is depth 0
    });

    const queue: Array<{ url: string; depth: number }> = [{ url: seedUrl, depth: 0 }];
    const maxPagesToCrawl = 25;
    let pagesCrawledCount = 0;

    while (queue.length > 0 && pagesCrawledCount < maxPagesToCrawl) {
      const current = queue.shift();
      if (!current) continue;
      
      const { url, depth } = current;
      if (visited.has(url)) continue;
      visited.add(url);
      pagesCrawledCount++;

      setProgress({ current: pagesCrawledCount, total: Math.min(visited.size + queue.length, maxPagesToCrawl) });
      log(`[CRAWL] Fetching URN depth ${depth} [${pagesCrawledCount}] - <${url}>`);

      try {
        const html = await fetchWithRetriesAndCooldowns(url, useTabRendering);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const title = doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const rawKeywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

        const headingsText: string[] = [];
        doc.querySelectorAll('h1, h2, h3').forEach(h => {
          if (h.textContent) headingsText.push(h.textContent);
        });

        const anchors = doc.querySelectorAll('a');
        const outgoingLinks: string[] = [];

        anchors.forEach(a => {
          const href = a.getAttribute('href');
          if (href) {
            try {
              const absoluteUrl = new URL(href, url).toString();
              if (absoluteUrl.startsWith('http') && !absoluteUrl.includes('#') && absoluteUrl !== url) {
                outgoingLinks.push(absoluteUrl);
              }
            } catch {
              // ignore
            }
          }
        });

        // Parse link relationships
        const linkTags = doc.querySelectorAll('link');
        linkTags.forEach(link => {
          const rel = link.getAttribute('rel');
          const href = link.getAttribute('href');
          if (href && rel && (rel.includes('describedby') || rel.includes('alternate') || rel.includes('linkset'))) {
            try {
              const absoluteUrl = new URL(href, url).toString();
              outgoingLinks.push(absoluteUrl);
            } catch {
              // ignore
            }
          }
        });

        // Regex fallback
        if (outgoingLinks.length === 0) {
          const hrefRegex = /href=["']([^"'>\s#]+)/gi;
          let match: RegExpExecArray | null;
          while ((match = hrefRegex.exec(html)) !== null) {
            const hrefVal = match[1];
            if (hrefVal) {
              try {
                const absoluteUrl = new URL(hrefVal, url).toString();
                if (absoluteUrl.startsWith('http') && !absoluteUrl.includes('#') && absoluteUrl !== url) {
                  outgoingLinks.push(absoluteUrl);
                }
              } catch {
                // ignore
              }
            }
          }
        }

        if (title) extractWordsFromText(title, localKeywordFreq);
        if (description) extractWordsFromText(description, localKeywordFreq);
        if (rawKeywords) {
          rawKeywords.split(',').forEach(kw => extractWordsFromText(kw, localKeywordFreq));
        }
        headingsText.forEach(ht => extractWordsFromText(ht, localKeywordFreq));

        const uniqueLinks = Array.from(new Set(outgoingLinks)).slice(0, 10);
        log(`[SUCCESS] Extracted ${uniqueLinks.length} outgoing links from <${url}>`);

        uniqueLinks.forEach(targetUrl => {
          const edgeExists = localEdges.some(e => e.source === url && e.target === targetUrl);
          if (!edgeExists) {
            localEdges.push({
              source: url,
              target: targetUrl,
              label: 'linksTo',
              type: 'link'
            });
          }

          if (!localNodesMap.has(targetUrl)) {
            localNodesMap.set(targetUrl, {
              id: targetUrl,
              label: targetUrl,
              pageRank: 0.0,
              type: 'html',
              harvested: false,
              inDegree: 0,
              outDegree: 0,
              depth: depth + 1 // Save discovery depth hop distance from seed
            });

            // Sequential BFS queueing limited by dynamic maxDepth slider
            if (depth < maxDepth - 1) {
              queue.push({ url: targetUrl, depth: depth + 1 });
            }
          }
        });

        const nodeObj = localNodesMap.get(url);
        if (nodeObj) {
          nodeObj.title = title || url;
          nodeObj.description = description || 'No description meta found.';
          nodeObj.keywords = rawKeywords.split(',').map(k => k.trim()).filter(Boolean);
        }

      } catch (err: any) {
        log(`[ERROR] Crawling aborted for URN <${url}>: ${err.message}`);
      }

      if (queue.length > 0 && pagesCrawledCount < maxPagesToCrawl) {
        await sleep(crawlDelay);
      }
    }

    // Solve PageRank personalized strictly to seed URN
    const finalNodes = computePageRank(Array.from(localNodesMap.values()), localEdges, seedUrl);
    setNodes(finalNodes.sort((a, b) => b.pageRank - a.pageRank));
    setEdges(localEdges);
    setKeywordCloud(localKeywordFreq);
    setCurrentPhase('html-complete');
    log(`[SUCCESS] Phase 1 finished successfully. Crawler evaluated personalized PageRank scores.`);
  };

  // Phase 2 & 3: Targeted RDF extraction and semantic traversal
  const runTripleHarvest = async () => {
    if (nodes.length === 0) return;
    setCurrentPhase('semantic-harvesting');
    
    const seedUrl = nodes.find(n => n.depth === 0)?.id || nodes[0]?.id || '';
    log(`[INFO] Phase 2: Starting targeted semantic harvesting relative to seed <${seedUrl}>`);

    const topImportantNodes = nodes.slice(0, 5);
    log(`[INFO] Firing WRX semantic pipelines on top 5 PageRank authority targets...`);

    const harvestedNodes = new Set<string>();
    const localTriples: Quad[] = [];
    const localEdges = [...edges];
    const localNodesMap = new Map<string, AutocrawlNode>();
    
    nodes.forEach(n => {
      localNodesMap.set(n.id, { ...n });
    });

    setProgress({ current: 0, total: topImportantNodes.length });

    let count = 0;
    for (const targetNode of topImportantNodes) {
      count++;
      setProgress({ current: count, total: topImportantNodes.length });
      log(`[HARVEST] Targeted extraction [${count}/5] - URN <${targetNode.id}>`);

      try {
        const rdfResult = await extractRDF(targetNode.id);
        const linkRels = await extractLinkRelations(targetNode.id);

        let parsedQuads: Quad[] = [];
        let finalUrl = targetNode.id;

        if (rdfResult) {
          finalUrl = rdfResult.url || targetNode.id;
          const format = (rdfResult.format || '').toLowerCase();
          
          if (format.includes('jsonld') || format.includes('json')) {
            parsedQuads = await parseJsonLd(rdfResult.content, finalUrl);
          } else {
            try {
              const parser = new Parser({ baseIRI: finalUrl });
              parsedQuads = parser.parse(rdfResult.content);
            } catch {
              // ignore
            }
          }
        }

        let combinedQuads = [...parsedQuads];
        if (linkRels && linkRels.length > 0) {
          const relationQuads = convertRelationsToQuads(linkRels, finalUrl);
          combinedQuads = [...combinedQuads, ...relationQuads];
        }

        log(`[SUCCESS] Harvested ${combinedQuads.length} RDF triples from <${targetNode.id}>`);
        harvestedNodes.add(targetNode.id);

        combinedQuads.forEach(q => {
          localTriples.push(q);
          
          if (q.object.termType === 'NamedNode' && q.object.value.startsWith('http')) {
            const predLocal = q.predicate.value.split('#').pop()?.split('/').pop() || 'relation';
            const sourceUrl = q.subject.value.startsWith('http') ? q.subject.value : targetNode.id;
            const targetUrl = q.object.value;

            const edgeExists = localEdges.some(e => e.source === sourceUrl && e.target === targetUrl && e.label === predLocal);
            if (!edgeExists) {
              localEdges.push({
                source: sourceUrl,
                target: targetUrl,
                label: predLocal,
                type: 'triple'
              });
            }

            if (!localNodesMap.has(targetUrl)) {
              // Semantic nodes inherit discovery depth of the page they were harvested from + 1
              const parentDepth = localNodesMap.get(targetNode.id)?.depth || 0;
              localNodesMap.set(targetUrl, {
                id: targetUrl,
                label: targetUrl,
                pageRank: 0.0,
                type: 'semantic',
                harvested: false,
                inDegree: 0,
                outDegree: 0,
                depth: parentDepth + 1
              });
            }
          }
        });

        const existingNode = localNodesMap.get(targetNode.id);
        if (existingNode) {
          existingNode.harvested = true;
        }

      } catch (err: any) {
        log(`[ERROR] Harvest failed for <${targetNode.id}>: ${err.message}`);
      }

      if (count < topImportantNodes.length) {
        await sleep(crawlDelay);
      }
    }

    setGlobalTriples(prev => {
      const merged = [...prev];
      localTriples.forEach(q => {
        if (!merged.some(eq => eq.subject.value === q.subject.value && eq.predicate.value === q.predicate.value && eq.object.value === q.object.value)) {
          merged.push(q);
        }
      });
      return merged;
    });

    log('[INFO] Recalculating personalized PageRank on combined web & semantic networks...');
    
    const updatedNodes = Array.from(localNodesMap.values()).map(n => {
      if (harvestedNodes.has(n.id)) n.harvested = true;
      return n;
    });

    const finalRanks = computePageRank(updatedNodes, localEdges, seedUrl);
    setNodes(finalRanks.sort((a, b) => b.pageRank - a.pageRank));
    setEdges(localEdges);
    setCurrentPhase('semantic-complete');
    log('[SUCCESS] Semantic Analysis complete! Autocrawl network maps fully compiled.');
  };

  const resetAutocrawl = () => {
    setCurrentPhase('idle');
    setCrawlLog([]);
    setNodes([]);
    setEdges([]);
    setKeywordCloud({});
    setProgress({ current: 0, total: 0 });
  };

  return {
    currentPhase,
    crawlLog,
    nodes,
    edges,
    progress,
    crawlDelay,
    setCrawlDelay,
    keywordCloud,
    useTabRendering,
    setUseTabRendering,
    maxDepth,
    setMaxDepth,
    runHtmlCrawl,
    runTripleHarvest,
    resetAutocrawl
  };
};
