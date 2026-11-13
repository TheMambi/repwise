import { useEffect, useRef, useState } from 'react'
import NeuralBackground from '@/components/ui/flow-field-background'
import { exercisesData } from '@/data/exercises'
import {
  DAY_COUNTS,
  EQUIPMENT,
  FOCUS_AREAS,
  LEVELS,
  SESSION_LENGTHS,
  type DayCount,
  type Equipment,
  type FocusArea,
  type Goal,
  type Level
} from '@/data/options'
import {
  Dumbbell,
  Clock,
  Target,
  Calendar,
  Bolt,
  Gauge,
  RotateCcw,
  ChevronRight,
  X,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PremiumButton, GlassCard, SelectionPill } from '@/components/ui/premium-ui'
import { buildWeeklyPlan, type DayPlan, type PlannedExercise } from '@/lib/planner'
import { sessionLengthText, volumeText } from '@/lib/plan-text'

function App() {
  // Form State
  const [time, setTime] = useState(30);
  const [goal, setGoal] = useState<Goal>('growth');
  const [level, setLevel] = useState<Level>('Beginner');
  const [daysPerWeek, setDaysPerWeek] = useState<DayCount>(3);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [focusMuscles, setFocusMuscles] = useState<FocusArea[]>([...FOCUS_AREAS]);

  // App State
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<PlannedExercise | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const planHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstSettingRef = useRef<HTMLButtonElement>(null);

  // showModal makes the browser keep focus inside the dialog, close it on Escape and hand focus back to the card.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedExercise && dialog && !dialog.open) dialog.showModal();
  }, [selectedExercise]);

  // Swapping the form and the plan removes the button that had focus, so focus is placed in the new view.
  const planShown = weeklyPlan !== null;
  const wasPlanShown = useRef(planShown);
  useEffect(() => {
    if (wasPlanShown.current === planShown) return;
    wasPlanShown.current = planShown;
    if (planShown) {
      planHeadingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      firstSettingRef.current?.focus();
    }
  }, [planShown]);

  const toggleEquipment = (eq: Equipment) => {
    setAvailableEquipment(prev => (prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]));
  };

  const toggleMuscle = (m: FocusArea) => {
    setFocusMuscles(prev => {
      if (!prev.includes(m)) return [...prev, m];
      // A plan needs at least one focus area.
      return prev.length > 1 ? prev.filter(item => item !== m) : prev;
    });
  };

  const generatePlan = () => {
    const plan = buildWeeklyPlan(exercisesData, {
      time,
      goal,
      level,
      daysPerWeek,
      equipment: availableEquipment,
      // Keep the split in a fixed order regardless of the order pills were tapped.
      focusMuscles: FOCUS_AREAS.filter(m => focusMuscles.includes(m)),
    });

    setWeeklyPlan(plan);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground color="#8b5cf6" particleCount={400} speed={0.5} trailOpacity={0.1} />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] opacity-80" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {!weeklyPlan ? (
          <div className="flex flex-col items-center text-center space-y-16">
            {/* Hero Section */}
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase text-indigo-400 animate-fade-in">
                <Play className="w-3 h-3 fill-current" /> Next-Gen Training
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight drop-shadow-2xl">
                Rep<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">wise</span>
              </h1>
              <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto">
                Stop guessing. Start building. Generate a high-performance weekly workout plan
                tailored to your gear, your goals, and your schedule.
              </p>
            </div>

            {/* Config Section */}
            <GlassCard className="w-full max-w-4xl grid md:grid-cols-2 gap-12 text-left">
              <div className="space-y-10">
                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time & Volume
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {SESSION_LENGTHS.map((m, index) => (
                      <button
                        key={m}
                        ref={index === 0 ? firstSettingRef : undefined}
                        type="button"
                        aria-pressed={time === m}
                        aria-label={`${m} minutes per session`}
                        onClick={() => setTime(m)}
                        className={cn(
                          "py-3 rounded-2xl border transition-all text-sm font-bold",
                          time === m ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" /> Primary Goal
                  </h2>
                  <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      aria-pressed={goal === 'growth'}
                      onClick={() => setGoal('growth')}
                      className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", goal === 'growth' ? "bg-white/10 text-white" : "text-white/60")}
                    >Growth</button>
                    <button
                      type="button"
                      aria-pressed={goal === 'definition'}
                      aria-label="Definition"
                      onClick={() => setGoal('definition')}
                      className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", goal === 'definition' ? "bg-white/10 text-white" : "text-white/60")}
                    >Def</button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Days / Week
                  </h2>
                  <div className="flex justify-between gap-2">
                    {DAY_COUNTS.map(d => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={daysPerWeek === d}
                        aria-label={`${d} days per week`}
                        onClick={() => setDaysPerWeek(d)}
                        className={cn(
                          "w-10 h-10 rounded-full border transition-all flex items-center justify-center text-sm font-bold",
                          daysPerWeek === d ? "bg-indigo-600 border-indigo-600" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-10 border-l border-white/5 pl-0 md:pl-12">
                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" /> Equipment
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT.map(eq => (
                      <SelectionPill
                        key={eq}
                        label={eq}
                        selected={availableEquipment.includes(eq)}
                        onClick={() => toggleEquipment(eq)}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white/60">Bodyweight movements are always included.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Bolt className="w-4 h-4" /> Focus Areas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_AREAS.map(m => (
                      <SelectionPill
                        key={m}
                        label={m}
                        selected={focusMuscles.includes(m)}
                        onClick={() => toggleMuscle(m)}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Gauge className="w-4 h-4" /> Level
                  </h2>
                  <div className="flex flex-col sm:flex-row bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        type="button"
                        aria-pressed={level === l}
                        onClick={() => setLevel(l)}
                        className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", level === l ? "bg-white/10 text-white" : "text-white/60")}
                      >{l}</button>
                    ))}
                  </div>
                </section>
              </div>
            </GlassCard>

            <PremiumButton onClick={generatePlan} icon={Bolt} className="text-xl px-12 py-5">
              Launch Program
            </PremiumButton>
          </div>
        ) : (
          <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-700">
            <header className="flex flex-wrap justify-between items-end gap-4 pb-8 border-b border-white/10">
              <div>
                <h1 ref={planHeadingRef} tabIndex={-1} className="text-4xl font-black tracking-tight outline-none">Your Custom Regimen</h1>
                <p className="text-white/60 mt-1">Generated based on your profile</p>
              </div>
              <PremiumButton variant="outline" onClick={() => setWeeklyPlan(null)} icon={RotateCcw} className="px-6 py-2 text-xs uppercase tracking-widest">
                Reconfigure
              </PremiumButton>
            </header>

            <div className="grid gap-8">
              {weeklyPlan.map((day, idx) => (
                <div key={day.day} className="group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{day.day} <span className="text-white/60 font-medium ml-2 text-lg">· {day.focus}</span></h2>
                      <p className="text-sm text-white/60 mt-1">{sessionLengthText(day, time)}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {day.exercises.map(ex => (
                      <button
                        key={ex.name}
                        type="button"
                        onClick={() => setSelectedExercise(ex)}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all flex justify-between items-center group/item"
                      >
                        <div>
                          <p className="font-bold text-white/80 group-hover/item:text-white transition-colors">{ex.name} <span className="text-white/60 font-medium ml-2 text-sm">· {ex.difficulty}</span></p>
                          <p className="text-xs text-white/60 mt-1 uppercase font-black tracking-widest">{volumeText(ex)} · {ex.rest} seconds rest</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover/item:translate-x-1 group-hover/item:text-white transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal - Simplified & Premium */}
      <dialog
        ref={dialogRef}
        aria-labelledby="exercise-title"
        onClose={() => setSelectedExercise(null)}
        // A click on the backdrop arrives on the dialog itself. The content fills the dialog, so any other target is inside it.
        onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        className="w-[calc(100%-3rem)] max-w-xl max-h-[calc(100%-3rem)] open:flex flex-col bg-[#111] text-white border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.15)] backdrop:bg-black/90 backdrop:backdrop-blur-xl"
      >
        {selectedExercise && (
          <div className="p-6 sm:p-10 space-y-8 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="text-xs font-black tracking-widest uppercase text-indigo-400">{selectedExercise.category}</div>
                <h2 id="exercise-title" className="text-3xl sm:text-4xl font-black tracking-tight">{selectedExercise.name}</h2>
              </div>
              <button type="button" aria-label="Close exercise details" onClick={() => dialogRef.current?.close()} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-lg text-white/60 leading-relaxed italic border-l-2 border-indigo-500 pl-6">
              "{selectedExercise.description}"
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
              <div className="col-span-2"><p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-1">Volume</p><p className="text-xl font-bold">{volumeText(selectedExercise)}</p></div>
              <div><p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-1">Rest</p><p className="text-xl font-bold">{selectedExercise.rest} seconds</p></div>
              <div><p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-1">Target</p><p className="text-xl font-bold">{selectedExercise.primary_muscle}</p></div>
              <div><p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-1">Level</p><p className="text-xl font-bold">{selectedExercise.difficulty}</p></div>
            </div>

            <PremiumButton onClick={() => dialogRef.current?.close()} className="w-full py-4 mt-4">Got it</PremiumButton>
          </div>
        )}
      </dialog>
    </div>
  )
}

export default App
