import { Loader2, ChevronRight, Sparkles, Bot } from 'lucide-react';
import { AgentStep } from '../../../agent';

interface AgentActiveConsoleProps {
  isAgentRunning: boolean;
  agentLogs: AgentStep[];
  agentAnswer: string;
  agentStatusText: string;
  agentCurrentCalls: number;
  agentMaxCalls: number;
}

export const AgentActiveConsole = ({
  isAgentRunning,
  agentLogs,
  agentAnswer,
  agentStatusText,
  agentCurrentCalls,
  agentMaxCalls
}: AgentActiveConsoleProps) => {
  return (
    <div className="agent-results-card">
      {isAgentRunning || agentLogs.length > 0 ? (
        <div className="agent-session-active">
          <div className="agent-status-card">
            <div className="status-card-header-row">
              <span className="status-label">Agent State:</span>
              <span className="status-val text-glow-purple">{agentStatusText}</span>
              {isAgentRunning && <Loader2 className="spinner inline-spinner" size={14} />}
            </div>
            <div className="agent-progress-micro">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(agentCurrentCalls / agentMaxCalls) * 100}%` }}
              ></div>
            </div>
            <span className="progress-label">{agentCurrentCalls} / {agentMaxCalls} WRX calls used</span>
          </div>

          <div className="agent-terminal-panel">
            <h5>Agent Thinking Trace & Operations Console</h5>
            <div className="terminal-timeline-wrapper">
              {agentLogs.map((log) => (
                <div key={log.id} className={`terminal-step-card ${log.status}`}>
                  <div className="step-header-row">
                    <span className="step-time">[{log.timestamp}]</span>
                    <span className={`step-badge ${log.status}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="step-thought">{log.thought}</p>
                  {log.query && (
                    <pre className="terminal-query-code">
                      <code>{log.query}</code>
                    </pre>
                  )}
                  {log.queryResults && (
                    <pre className="terminal-results-code">
                      <code>{log.queryResults}</code>
                    </pre>
                  )}
                  {log.actionText && (
                    <div className="step-action-tag">
                      <ChevronRight size={10} />
                      <strong>Action:</strong> {log.actionText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {agentAnswer && (
            <div className="agent-final-answer-card glass-card">
              <div className="answer-header">
                <Sparkles size={16} className="text-glow-purple" />
                <h4>AI Final Synthesis Answer</h4>
              </div>
              <div className="answer-content">
                <p>{agentAnswer}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="agent-session-idle">
          <Bot size={48} className="idle-bot-icon" />
          <h4>Agent Console Idle</h4>
          <p>Enter a query and run the agent to watch it traverse discovered linksets, crawl RDF targets, and compile answers in real-time!</p>
        </div>
      )}
    </div>
  );
};
