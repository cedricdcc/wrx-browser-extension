import { Bot } from 'lucide-react';
import { AgentConfigCard } from './AgentConfigCard';
import { ShaclShapesCard } from './ShaclShapesCard';
import { AgentActiveConsole } from './AgentActiveConsole';
import { AgentStep } from '../../../agent';

interface AgentTabProps {
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
  agentLogs: AgentStep[];
  agentAnswer: string;
  agentStatusText: string;
  agentCurrentCalls: number;
  showAgentSettings: boolean;
  setShowAgentSettings: (val: boolean) => void;
  handleStartAgent: () => void;
  handleStopAgent: () => void;
  shaclShapesText: string;
}

export const AgentTab = ({
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
  agentLogs,
  agentAnswer,
  agentStatusText,
  agentCurrentCalls,
  showAgentSettings,
  setShowAgentSettings,
  handleStartAgent,
  handleStopAgent,
  shaclShapesText
}: AgentTabProps) => {
  return (
    <div className="tab-panel flex-col agent-panel">
      <div className="agent-intro-container">
        <div className="agent-intro-header">
          <Bot className="agent-bot-icon text-glow-purple" size={32} />
          <div className="agent-intro-title">
            <h3>AI Exploration Agent</h3>
            <p>Ask a question about your knowledge graph. The agent will analyze available triples and autonomously cascade-crawl new resources to discover the solution.</p>
          </div>
        </div>
      </div>

      <div className="agent-dashboard-grid">
        {/* LEFT COLUMN: Sidebar with Controls & SHACL */}
        <div className="agent-sidebar">
          <AgentConfigCard
            agentEndpoint={agentEndpoint}
            setAgentEndpoint={setAgentEndpoint}
            agentApiKey={agentApiKey}
            setAgentApiKey={setAgentApiKey}
            agentModel={agentModel}
            setAgentModel={setAgentModel}
            agentFormat={agentFormat}
            setAgentFormat={setAgentFormat}
            agentMaxCalls={agentMaxCalls}
            setAgentMaxCalls={setAgentMaxCalls}
            agentQuestion={agentQuestion}
            setAgentQuestion={setAgentQuestion}
            isAgentRunning={isAgentRunning}
            showAgentSettings={showAgentSettings}
            setShowAgentSettings={setShowAgentSettings}
            handleStartAgent={handleStartAgent}
            handleStopAgent={handleStopAgent}
          />

          <ShaclShapesCard shaclShapesText={shaclShapesText} />
        </div>

        {/* RIGHT COLUMN: Terminal trace & Response */}
        <AgentActiveConsole
          isAgentRunning={isAgentRunning}
          agentLogs={agentLogs}
          agentAnswer={agentAnswer}
          agentStatusText={agentStatusText}
          agentCurrentCalls={agentCurrentCalls}
          agentMaxCalls={agentMaxCalls}
        />
      </div>
    </div>
  );
};
