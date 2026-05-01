type OnboardingScreenProps = {
  modelStatus: string;
  availableModels: string[];
  selectedModel: string;
  petName: string;
  onModelSelect: (model: string) => void;
  onNameChange: (name: string) => void;
  onSetName: () => void;
  onHatch: () => void;
  stage: 'onboarding' | 'named_egg' | 'hatching' | 'alive';
};

export const OnboardingScreen = ({
  modelStatus,
  availableModels,
  selectedModel,
  petName,
  onModelSelect,
  onNameChange,
  onSetName,
  onHatch,
  stage,
}: OnboardingScreenProps) => {
  if (stage === 'alive' || stage === 'hatching') return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-egg-preview">
          <div className="onboarding-egg-shape" />
        </div>

        <h1 className="onboarding-title">Lamagotchi</h1>
        <p className="onboarding-subtitle">Your local AI companion awaits</p>

        <div className="onboarding-status">
          <span className={`status-dot ${modelStatus.includes('Connected') ? 'status-dot--ok' : modelStatus.includes('not detected') ? 'status-dot--err' : 'status-dot--warn'}`} />
          <span>{modelStatus}</span>
        </div>

        {availableModels.length > 0 && (
          <div className="onboarding-field">
            <label htmlFor="model-pick">Choose Model</label>
            <select
              id="model-pick"
              value={selectedModel}
              onChange={(e) => onModelSelect(e.target.value)}
              className="onboarding-select"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <div className="onboarding-field">
          <label htmlFor="name-input">Name Your Egg</label>
          <input
            id="name-input"
            value={petName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter a name..."
            className="onboarding-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && stage === 'onboarding') onSetName();
            }}
          />
        </div>

        <div className="onboarding-actions">
          {stage === 'onboarding' && (
            <button
              className="onboarding-btn onboarding-btn--primary"
              onClick={onSetName}
              disabled={!petName.trim() || !availableModels.length}
            >
              Name Egg
            </button>
          )}
          {stage === 'named_egg' && (
            <button
              className="onboarding-btn onboarding-btn--hatch"
              onClick={onHatch}
            >
              ✨ Hatch!
            </button>
          )}
        </div>

        {(!availableModels.length && modelStatus.includes('not detected')) && (
          <p className="onboarding-help">
            Start Ollama with <code>ollama serve</code> and pull a model like{' '}
            <code>ollama pull llama3.2</code>
          </p>
        )}
      </div>
    </div>
  );
};
