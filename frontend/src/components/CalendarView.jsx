import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PRIORITY_COLOR = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

export default function CalendarView({ tasks }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(t);
    }
  });

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <button className="cal-nav" onClick={prev}>‹</button>
        <span className="cal-month-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={next}>›</button>
      </div>
      <div className="cal-grid-header">
        {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-cell cal-cell--empty" />;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const dayTasks = tasksByDate[day] || [];
          return (
            <div key={day} className={`cal-cell${isToday ? ' cal-cell--today' : ''}${dayTasks.length ? ' cal-cell--has-tasks' : ''}`}>
              <span className="cal-date">{day}</span>
              <div className="cal-tasks">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="cal-task-chip"
                    style={{ background: PRIORITY_COLOR[t.priority] + '22', borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}` }}>
                    <span className={`cal-task-dot${t.status === 'Done' ? ' cal-task-dot--done' : ''}`} />
                    <span className="cal-task-title">{t.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="cal-more">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
