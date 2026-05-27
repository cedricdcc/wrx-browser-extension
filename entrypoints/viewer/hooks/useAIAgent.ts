import { useState, useEffect, useRef } from 'react';
import { Quad } from 'n3';
import {
  callLlmApi,
  getSystemPrompt,
  getUserPrompt,
  parseAgentResponse,
  AgentStep,
  AgentConfig,
  generateShaclShapes,
  executeLocalSparql,
  QueryHistoryLog
} from '../agent';

interface UseAIAgentProps {
  selectedUri: string;
  visitedNodes: any[];
  triplesRef: React.MutableRefObject<Quad[]>;
  visitedNodesRef: React.MutableRefObject<any[]>;
  navigationEdgesRef: React.MutableRefObject<any[]>;
  fetchSemanticData: (url: string, parentUri: string | null, relLabel: string) => Promise<void>;
  setError: (err: string) => void;
}

export const useAIAgent = ({
  selectedUri,
  visitedNodes,
  triplesRef,
  visitedNodesRef,
  navigationEdgesRef,
  fetchSemanticData,
  setError
}: UseAIAgentProps) => {
  // AI Exploration Agent Config & Execution states
  const [agentEndpoint, setAgentEndpoint] = useState<string>(() => {
    return sessionStorage.getItem('wrx_agent_endpoint') || 'http://localhost:8080/v1/chat/completions';
  });
  const [agentApiKey, setAgentApiKey] = useState<string>(() => {
    return sessionStorage.getItem('wrx_agent_apikey') || '';
  });
  const [agentModel, setAgentModel] = useState<string>(() => {
    return sessionStorage.getItem('wrx_agent_model') || 'local-model';
  });
  const [agentFormat, setAgentFormat] = useState<'chat' | 'legacy'>(() => {
    return (sessionStorage.getItem('wrx_agent_format') as any) || 'chat';
  });
  const [agentMaxCalls, setAgentMaxCalls] = useState<number>(() => {
    const saved = sessionStorage.getItem('wrx_agent_maxcalls');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [agentQuestion, setAgentQuestion] = useState<string>('');
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [agentLogs, setAgentLogs] = useState<AgentStep[]>([]);
  const [agentAnswer, setAgentAnswer] = useState<string>('');
  const [agentStatusText, setAgentStatusText] = useState<string>('');
  const [agentCurrentCalls, setAgentCurrentCalls] = useState<number>(0);
  const [showAgentSettings, setShowAgentSettings] = useState<boolean>(false);
  const [agentAbortController, setAgentAbortController] = useState<AbortController | null>(null);
  const [agentQueryHistory, setAgentQueryHistory] = useState<QueryHistoryLog[]>([]);

  const agentQueryHistoryRef = useRef(agentQueryHistory);
  useEffect(() => { agentQueryHistoryRef.current = agentQueryHistory; }, [agentQueryHistory]);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('wrx_agent_endpoint', agentEndpoint);
  }, [agentEndpoint]);

  useEffect(() => {
    sessionStorage.setItem('wrx_agent_apikey', agentApiKey);
  }, [agentApiKey]);

  useEffect(() => {
    sessionStorage.setItem('wrx_agent_model', agentModel);
  }, [agentModel]);

  useEffect(() => {
    sessionStorage.setItem('wrx_agent_format', agentFormat);
  }, [agentFormat]);

  useEffect(() => {
    sessionStorage.setItem('wrx_agent_maxcalls', agentMaxCalls.toString());
  }, [agentMaxCalls]);

  const handleStartAgent = async () => {
    if (!agentQuestion.trim()) {
      setError('Please provide a valid question for the AI Search Agent.');
      return;
    }

    setIsAgentRunning(true);
    setAgentLogs([]);
    setAgentAnswer('');
    setAgentQueryHistory([]);
    setAgentStatusText('🧠 Spawning agent session...');
    setAgentCurrentCalls(0);

    const controller = new AbortController();
    setAgentAbortController(controller);

    try {
      let currentCallsCount = 0;
      const config: AgentConfig = {
        endpoint: agentEndpoint,
        apiKey: agentApiKey,
        modelName: agentModel,
        apiFormat: agentFormat,
        maxCalls: agentMaxCalls
      };

      while (true) {
        if (controller.signal.aborted) {
          throw new Error('Agent session aborted by user.');
        }

        // Get latest values from refs to prevent stale closure bugs
        const activeTriples = triplesRef.current;
        const activeVisited = visitedNodesRef.current;
        const activeEdges = navigationEdgesRef.current;
        const activeHistory = agentQueryHistoryRef.current;

        const visitedSet = new Set<string>(activeVisited.map(n => n.id));
        const availableSet = new Set<string>();

        activeTriples.forEach(t => {
          if (t.subject.termType === 'NamedNode' && t.subject.value.startsWith('http') && !visitedSet.has(t.subject.value)) {
            availableSet.add(t.subject.value);
          }
          if (t.object.termType === 'NamedNode' && t.object.value.startsWith('http') && !visitedSet.has(t.object.value)) {
            availableSet.add(t.object.value);
          }
        });
        activeEdges.forEach(e => {
          if (!visitedSet.has(e.target)) {
            availableSet.add(e.target);
          }
        });

        const availableUris = Array.from(availableSet);

        // 1. Generate structural SHACL shapes Turtle dynamically
        const shaclShapesTurtle = generateShaclShapes(activeTriples);

        // Append a new reasoning step to the terminal log
        const stepId = Math.random().toString(36).substring(7);
        const newStep: AgentStep = {
          id: stepId,
          timestamp: new Date().toLocaleTimeString(),
          status: 'reasoning',
          thought: 'Analyzing SHACL schema and query history to formulate next exploration step...',
          actionText: 'Invoking LLM for reasoning'
        };
        setAgentLogs(prev => [...prev, newStep]);
        setAgentStatusText('🧠 Reasoning on current data...');

        // Build prompts and query the LLM API
        const sysPrompt = getSystemPrompt();
        const userPrompt = getUserPrompt(
          agentQuestion,
          shaclShapesTurtle,
          Array.from(visitedSet),
          availableUris,
          activeHistory,
          currentCallsCount,
          agentMaxCalls
        );

        const responseText = await callLlmApi(config, sysPrompt, userPrompt, controller.signal);
        const parsed = parseAgentResponse(responseText);

        // Update the current log step with the LLM's thought process
        setAgentLogs(prev => prev.map(s => s.id === stepId ? {
          ...s,
          thought: parsed.thought,
          actionText: parsed.action === 'sparql' 
            ? `Execute SPARQL: ${parsed.query}`
            : parsed.action === 'crawl' 
              ? `Crawl target: ${parsed.target}` 
              : 'Provide final answer'
        } : s));

        // Evaluate Agent decision
        if (parsed.action === 'sparql' && parsed.query) {
          setAgentStatusText(`⚡ Executing SPARQL query...`);

          const sparqlStepId = Math.random().toString(36).substring(7);
          const sparqlStep: AgentStep = {
            id: sparqlStepId,
            timestamp: new Date().toLocaleTimeString(),
            status: 'sparql',
            thought: `Running local SPARQL query to retrieve targeted data...`,
            actionText: `SPARQL: ${parsed.query}`,
            query: parsed.query
          };
          setAgentLogs(prev => [...prev, sparqlStep]);

          // Execute local SPARQL unification query
          const rows = executeLocalSparql(parsed.query, activeTriples);
          const resultsPreview = rows.length > 0
            ? JSON.stringify(rows.slice(0, 10), null, 2)
            : '(Zero bindings matched)';

          // Update SPARQL step with results preview
          setAgentLogs(prev => prev.map(s => s.id === sparqlStepId ? {
            ...s,
            thought: `SPARQL query executed locally in browser. Matched ${rows.length} rows.`,
            queryResults: resultsPreview
          } : s));

          // Save to agentQueryHistory state
          const historyItem = {
            query: parsed.query,
            resultsCount: rows.length,
            preview: resultsPreview
          };
          setAgentQueryHistory(prev => [...prev, historyItem]);

          // Small yield to let React state commit and update agentQueryHistoryRef
          await new Promise(resolve => setTimeout(resolve, 100));

        } else if (parsed.action === 'crawl' && currentCallsCount < agentMaxCalls) {
          const targetUrl = parsed.target;
          if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
            setAgentStatusText(`🔍 Crawling: ${targetUrl}...`);

            const crawlStepId = Math.random().toString(36).substring(7);
            const crawlStep: AgentStep = {
              id: crawlStepId,
              timestamp: new Date().toLocaleTimeString(),
              status: 'crawling',
              thought: `Requested by AI agent. Fetching RDF & link relations for: ${targetUrl}`,
              actionText: `Crawl: ${targetUrl}`
            };
            setAgentLogs(prev => [...prev, crawlStep]);

            // Execute live crawl
            await fetchSemanticData(targetUrl, selectedUri || activeVisited[0]?.id || null, 'agent-crawl');

            setAgentLogs(prev => prev.map(s => s.id === crawlStepId ? {
              ...s,
              status: 'integrating',
              thought: `Crawl complete. Discovered triples successfully merged into active knowledge store.`
            } : s));

            currentCallsCount++;
            setAgentCurrentCalls(currentCallsCount);
          } else {
            // Target is invalid, default to answering
            parsed.action = 'answer';
            parsed.answer = `I tried to crawl "${targetUrl}" but it is not a valid HTTP/HTTPS resource. Based on what I know: ` + parsed.thought;
          }
        }
        
        if (parsed.action === 'answer' || currentCallsCount >= agentMaxCalls) {
          const answerStepId = Math.random().toString(36).substring(7);
          const answerStep: AgentStep = {
            id: answerStepId,
            timestamp: new Date().toLocaleTimeString(),
            status: 'answering',
            thought: 'Formulating final answer based on accumulated evidence...',
            actionText: 'Formulating answer'
          };
          setAgentLogs(prev => [...prev, answerStep]);
          setAgentStatusText('🎯 Formulating final answer...');

          let finalResponse = parsed.answer || 'I have completed my graph search. Here is the context gathered.';
          
          if (currentCallsCount >= agentMaxCalls && parsed.action === 'crawl') {
            setAgentStatusText('🎯 Crawler limit hit. Force-generating final answer...');
            const forcePrompt = `### User Question:\n${agentQuestion}\n\n### NOTICE:\nYou have reached the maximum allowed crawler calls (${agentMaxCalls}). You MUST now formulate your final answer based ONLY on the current triples and query history below.\n\n### Query History:\n${JSON.stringify(agentQueryHistoryRef.current, null, 2)}\n\nFormulate your final answer:`;
            
            const lastAnswerText = await callLlmApi(
              config,
              'You are a helpful assistant. Formulate your final answer to the question using only the query history provided.',
              forcePrompt,
              controller.signal
            );
            finalResponse = lastAnswerText;
          }

          setAgentAnswer(finalResponse);

          setAgentLogs(prev => prev.map(s => s.id === answerStepId ? {
            ...s,
            status: 'complete',
            thought: 'Finished! Delivering answer to user.',
            actionText: 'Loop complete'
          } : s));

          setIsAgentRunning(false);
          setAgentStatusText('🎯 Agent completed successfully!');
          break;
        }
      }
    } catch (err: any) {
      console.error('Agent error:', err);
      const errMsg = err.name === 'AbortError' ? 'Agent session stopped by user.' : (err.message || 'An unexpected error occurred in the agent thought loop.');
      
      const errorStep: AgentStep = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        status: 'error',
        thought: `Execution halted: ${errMsg}`,
        actionText: 'Halted'
      };
      setAgentLogs(prev => [...prev, errorStep]);
      setIsAgentRunning(false);
      setAgentStatusText(`❌ Agent stopped: ${errMsg}`);
      setError(errMsg);
    } finally {
      setAgentAbortController(null);
    }
  };

  const handleStopAgent = () => {
    if (agentAbortController) {
      agentAbortController.abort();
      setAgentAbortController(null);
    }
    setIsAgentRunning(false);
    setAgentStatusText('❌ Agent stopped by user.');
  };

  return {
    agentEndpoint,
    agentApiKey,
    agentModel,
    agentFormat,
    agentMaxCalls,
    agentQuestion,
    isAgentRunning,
    agentLogs,
    agentAnswer,
    agentStatusText,
    agentCurrentCalls,
    showAgentSettings,
    agentQueryHistory,
    setAgentEndpoint,
    setAgentApiKey,
    setAgentModel,
    setAgentFormat,
    setAgentMaxCalls,
    setAgentQuestion,
    setIsAgentRunning,
    setAgentLogs,
    setAgentAnswer,
    setAgentStatusText,
    setShowAgentSettings,
    handleStartAgent,
    handleStopAgent
  };
};
