import { Settings, Play, Square } from 'lucide-react';

interface AgentConfigCardProps {
  agentEndpoint: string;
  setAgentEndpoint: (val: string) => void;
  agentApiKey: string;
  setAgentApiKey: (val: string) => void;
  agentModel: string;
  setAgentModel: (val: string) => void;
  agentFormat: 'chat' | 'legacy';
  setAgentFormat: (val: 'chat' | 'legacy') => void;
  agentMaxCalls: number;
  setAgentMaxCalls: (val: number) => void;
  agentQuestion: string;
  setAgentQuestion: (val: string) => void;
  isAgentRunning: boolean;
  showAgentSettings: boolean;
  setShowAgentSettings: (val: boolean) => void;
  handleStartAgent: () => void;
  handleStopAgent: () => void;
}

export const AgentConfigCard = ({
  agentEndpoint,
  setAgentEndpoint,
  agentApiKey,
  setAgentApiKey,
  agentModel,
  setAgentModel,
  agentFormat,
  setAgentFormat,
  agentMaxCalls,
  setAgentMaxCalls,
  agentQuestion,
  setAgentQuestion,
  isAgentRunning,
  showAgentSettings,
  setShowAgentSettings,
  handleStartAgent,
  handleStopAgent
}: AgentConfigCardProps) => {
  return (
    <div className="agent-sidebar">
      <div className="agent-controls-card">
        <div className="agent-card-header">
          <h4>Agent Configuration</h4>
          <button
            type="button"
            className="settings-toggle-btn"
            onClick={() => setShowAgentSettings(!showAgentSettings)}
            title="Toggle Advanced LLM API Settings"
          >
            <Settings size={14} />
            {showAgentSettings ? 'Hide Advanced' : 'Advanced API'}
          </button>
        </div>

        <div className="settings-field always-visible-endpoint">
          <label>llama.cpp / LLM API Endpoint URL</label>
          <input
            type="text"
            value={agentEndpoint}
            onChange={(e) => setAgentEndpoint(e.target.value)}
            placeholder="e.g. http://localhost:8080/v1/chat/completions"
          />
        </div>

        {showAgentSettings && (
          <div className="agent-settings-panel glass-card">
            <div className="settings-field">
              <label>API Format</label>
              <select
                value={agentFormat}
                onChange={(e) => setAgentFormat(e.target.value as any)}
                className="settings-select"
              >
                <option value="chat">Chat Completions (OpenAI / Ollama / llama.cpp standard)</option>
                <option value="legacy">Legacy Completions (llama.cpp /completion)</option>
              </select>
            </div>

            <div className="settings-field">
              <label>Model Name (Optional)</label>
              <input
                type="text"
                value={agentModel}
                onChange={(e) => setAgentModel(e.target.value)}
                placeholder="e.g. local-model"
              />
            </div>

            <div className="settings-field">
              <label>API Authorization Key (Optional)</label>
              <input
                type="password"
                value={agentApiKey}
                onChange={(e) => setAgentApiKey(e.target.value)}
                placeholder="Bearer token or leave blank"
              />
            </div>
          </div>
        )}

        <div className="settings-field crawler-limit-field">
          <div className="slider-label-row">
            <label>Max WRX Crawler Calls</label>
            <span className="slider-val-badge">{agentMaxCalls} calls max</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={agentMaxCalls}
            onChange={(e) => setAgentMaxCalls(parseInt(e.target.value, 10))}
            className="settings-slider"
            disabled={isAgentRunning}
          />
          <p className="slider-hint">Limits the autonomous hops the agent can crawl before answering.</p>
        </div>

        <div className="agent-query-box">
          <label>What would you like to ask the Knowledge Graph?</label>
          <textarea
            rows={3}
            value={agentQuestion}
            onChange={(e) => setAgentQuestion(e.target.value)}
            placeholder="e.g., Who created this dataset, and are there any related profiles or web link relations defined?"
            disabled={isAgentRunning}
            className="agent-textarea"
          />

          <div className="agent-action-buttons">
            {isAgentRunning ? (
              <button
                type="button"
                onClick={handleStopAgent}
                className="agent-btn stop-btn"
              >
                <Square size={14} />
                Abort Agent Session
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartAgent}
                disabled={!agentQuestion.trim()}
                className="agent-btn start-btn"
              >
                <Play size={14} />
                Spawn Agent Loop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
