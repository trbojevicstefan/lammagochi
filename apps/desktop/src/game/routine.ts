/** Daily routine & schedule system */
export interface TimeSlot { startHour:number; endHour:number; label:string; icon:string; activity:string; statBoost:Partial<Record<string,number>>; }

export const DEFAULT_SCHEDULE: TimeSlot[] = [
  { startHour:6, endHour:8, label:'Wake Up', icon:'☀️', activity:'morning stretch', statBoost:{energy:5,mood:3} },
  { startHour:8, endHour:10, label:'Breakfast', icon:'🍎', activity:'eating', statBoost:{hunger:20,mood:5} },
  { startHour:10, endHour:12, label:'Learning', icon:'📚', activity:'studying', statBoost:{knowledge:10,curiosity:5} },
  { startHour:12, endHour:14, label:'Playtime', icon:'🎾', activity:'playing', statBoost:{mood:10,boredom:-15} },
  { startHour:14, endHour:16, label:'Nap', icon:'😴', activity:'sleeping', statBoost:{energy:20,mood:3} },
  { startHour:16, endHour:18, label:'Activity', icon:'🧩', activity:'active', statBoost:{curiosity:5,mood:5} },
  { startHour:18, endHour:20, label:'Dinner', icon:'🍽️', activity:'eating', statBoost:{hunger:20,mood:5} },
  { startHour:20, endHour:22, label:'Wind Down', icon:'🌙', activity:'resting', statBoost:{energy:5} },
  { startHour:22, endHour:6, label:'Sleep', icon:'💤', activity:'sleeping', statBoost:{energy:15} },
];

export const getCurrentSlot = (): TimeSlot | null => {
  const hour = new Date().getHours();
  return DEFAULT_SCHEDULE.find(s => s.startHour <= hour && hour < (s.endHour < s.startHour ? s.endHour + 24 : s.endHour)) || null;
};

export const getRoutineText = (slot: TimeSlot | null): string => {
  if (!slot) return '';
  return `${slot.icon} ${slot.label} time — ${slot.activity}`;
};

let routineStreak = 0; let lastRoutineCheck = '';

export const checkRoutineStreak = (): { streak:number; bonus:number } => {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastRoutineCheck) { routineStreak++; lastRoutineCheck = today; }
  else { routineStreak = Math.max(1, routineStreak); }
  return { streak: routineStreak, bonus: Math.min(routineStreak * 2, 20) };
};
