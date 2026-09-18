import { useState } from 'react'
import NeuralBackground from '@/components/ui/flow-field-background'
import { exercisesData, type Exercise } from '@/data/exercises'
import {
  Dumbbell,
  Clock,
  Target,
  Calendar,
  Bolt,
  RotateCcw,
  ChevronRight,
  X,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PremiumButton, GlassCard, SelectionPill } from '@/components/ui/premium-ui'

interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
}

function App() {
  // Form State
  const [time, setTime] = useState(30);
  const [goal, setGoal] = useState<'growth' | 'definition'>('growth');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(['None']);
  const [focusMuscles, setFocusMuscles] = useState<string[]>(['Push', 'Pull', 'Legs', 'Core']);

  // App State
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const equipmentOptions = [
    'None', 'Dumbbells', 'Pull-up Bar', 'Resistance Band', 'TRX', 'Bench'
  ];

  const muscleOptions = [
    { label: 'Push', value: 'Push' },
    { label: 'Pull', value: 'Pull' },
    { label: 'Legs', value: 'Legs' },
    { label: 'Core', value: 'Core' }
  ];

  const toggleEquipment = (eq: string) => {
    setAvailableEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const toggleMuscle = (m: string) => {
    setFocusMuscles(prev =>
      prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
    );
  };

  const generatePlan = () => {
    const validExercises = exercisesData.filter(ex => {
      const dbEq = ex.equipment.toLowerCase();
      const currentEq = [...availableEquipment];
      if (!currentEq.includes("None")) currentEq.push("None");
      return currentEq.some(eq => dbEq.includes(eq.toLowerCase()));
    });

    const totalExercisesPerDay = Math.max(2, Math.floor(time / 5));
    let sets = 3, reps = "8-12", rest = "90s";
    if (goal === 'definition') { sets = 4; reps = "15-20"; rest = "45s"; }

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const daysOfWeek = allDays.slice(0, daysPerWeek);
    const plan: DayPlan[] = [];

    focusMuscles.forEach((muscle, index) => {
      const dayName = daysOfWeek[index % daysOfWeek.length];
      let muscleExercises = validExercises.filter(ex => ex.category === muscle);
      if (muscleExercises.length === 0) {
        muscleExercises = exercisesData.filter(ex => ex.category === muscle && ex.equipment === "None");
      }

      const shuffled = [...muscleExercises].sort(() => 0.5 - Math.random());
      const dayExercises = shuffled.slice(0, totalExercisesPerDay).map(ex => ({ ...ex, sets, reps, rest }));

      const existingDay = plan.find(d => d.day === dayName);
      if (existingDay) {
        existingDay.exercises.push(...dayExercises);
        existingDay.focus += ` & ${muscle}`;
      } else {
        plan.push({ day: dayName, focus: muscle + " Day", exercises: dayExercises });
      }
    });

    setWeeklyPlan(plan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground color="#8b5cf6" particleCount={400} speed={0.5} trailOpacity={0.1} />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] opacity-80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
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
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time & Volume
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[15, 30, 45, 60].map(m => (
                      <button
                        key={m}
                        onClick={() => setTime(m)}
                        className={cn(
                          "py-3 rounded-2xl border transition-all text-sm font-bold",
                          time === m ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" /> Primary Goal
                  </h3>
                  <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button
                      onClick={() => setGoal('growth')}
                      className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", goal === 'growth' ? "bg-white/10 text-white" : "text-white/40")}
                    >Growth</button>
                    <button
                      onClick={() => setGoal('definition')}
                      className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", goal === 'definition' ? "bg-white/10 text-white" : "text-white/40")}
                    >Def</button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Days / Week
                  </h3>
                  <div className="flex justify-between gap-2">
                    {[2, 3, 4, 5, 6].map(d => (
                      <button
                        key={d}
                        onClick={() => setDaysPerWeek(d)}
                        className={cn(
                          "w-10 h-10 rounded-full border transition-all flex items-center justify-center text-sm font-bold",
                          daysPerWeek === d ? "bg-indigo-500 border-indigo-500" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
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
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" /> Equipment
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {equipmentOptions.map(eq => (
                      <SelectionPill
                        key={eq}
                        label={eq === 'None' ? 'Bodyweight' : eq}
                        selected={availableEquipment.includes(eq)}
                        onClick={() => toggleEquipment(eq)}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Bolt className="w-4 h-4" /> Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {muscleOptions.map(m => (
                      <SelectionPill
                        key={m.value}
                        label={m.label}
                        selected={focusMuscles.includes(m.value)}
                        onClick={() => toggleMuscle(m.value)}
                      />
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
            <header className="flex justify-between items-end pb-8 border-b border-white/10">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Your Custom Regimen</h2>
                <p className="text-white/40 mt-1">Generated based on your profile</p>
              </div>
              <PremiumButton variant="outline" onClick={() => setWeeklyPlan(null)} icon={RotateCcw} className="px-6 py-2 text-xs uppercase tracking-widest">
                Reconfigure
              </PremiumButton>
            </header>

            <div className="grid gap-8">
              {weeklyPlan.map((day, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
                      {idx + 1}
                    </div>
                    <h3 className="text-2xl font-bold">{day.day} <span className="text-white/30 font-medium ml-2 text-lg">· {day.focus}</span></h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {day.exercises.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedExercise(ex); setIsModalOpen(true); }}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all flex justify-between items-center group/item"
                      >
                        <div>
                          <p className="font-bold text-white/80 group-hover/item:text-white transition-colors">{ex.name}</p>
                          <p className="text-xs text-white/40 mt-1 uppercase font-black tracking-widest">{ex.sets}x{ex.reps} · {ex.rest} Rest</p>
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
      </div>

      {/* Modal - Simplified & Premium */}
      {isModalOpen && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in transition-all" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#111] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.15)] animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="text-xs font-black tracking-widest uppercase text-indigo-400">{selectedExercise.category}</div>
                  <h2 className="text-4xl font-black tracking-tight">{selectedExercise.name}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-lg text-white/60 leading-relaxed italic border-l-2 border-indigo-500 pl-6">
                "{selectedExercise.description}"
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                <div><p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Volume</p><p className="text-xl font-bold">{selectedExercise.sets}x{selectedExercise.reps}</p></div>
                <div><p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Rest</p><p className="text-xl font-bold">{selectedExercise.rest}</p></div>
                <div><p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Target</p><p className="text-xl font-bold">{selectedExercise.primary_muscle}</p></div>
              </div>

              <PremiumButton onClick={() => setIsModalOpen(false)} className="w-full py-4 mt-4">Got it</PremiumButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
