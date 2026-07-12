import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { title: '👋 Welcome to TaskManager!', desc: 'Let\'s take a quick tour so you can hit the ground running. This will only take 30 seconds.', target: null },
  { title: '📊 Your Dashboard', desc: 'This is your command center. See all your stats, completion rate, overdue tasks and recent activity at a glance.', target: null },
  { title: '📁 Projects', desc: 'Click "Projects" in the navbar to create your first project. Each project gets its own Kanban board.', target: null },
  { title: '📋 Kanban Board', desc: 'Inside a project, drag & drop tasks between To Do, In Progress and Done columns. Add due dates, priorities and labels.', target: null },
  { title: '🔔 Notifications', desc: 'The bell icon in the navbar alerts you when tasks are overdue or due soon. Never miss a deadline.', target: null },
  { title: '🚀 You\'re all set!', desc: 'Create your first project and start adding tasks. Use keyboard shortcut N to quickly add a task when on the Tasks page.', target: null },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `onboarding_done_${user.username}`;
    if (!localStorage.getItem(key)) setVisible(true);
  }, [user]);

  const finish = () => {
    localStorage.setItem(`onboarding_done_${user.username}`, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboard-overlay">
      <div className="onboard-modal">
        <div className="onboard-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`onboard-dot${i === step ? ' onboard-dot--active' : i < step ? ' onboard-dot--done' : ''}`} />
          ))}
        </div>
        <div className="onboard-step-label">Step {step + 1} of {STEPS.length}</div>
        <h2 className="onboard-title">{current.title}</h2>
        <p className="onboard-desc">{current.desc}</p>
        <div className="onboard-actions">
          <button className="btn-outline onboard-skip" onClick={finish}>Skip tour</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && <button className="btn-outline" onClick={() => setStep(s => s - 1)}>← Back</button>}
            {isLast
              ? <button className="btn-primary" onClick={finish}>🎉 Let's go!</button>
              : <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
