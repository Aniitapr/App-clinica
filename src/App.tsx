/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Stethoscope, 
  Footprints, 
  Activity, 
  Scissors, 
  MapPin, 
  Phone, 
  Clock, 
  Brain, 
  CheckCircle2, 
  Sparkles,
  Send
} from "lucide-react";
import { format, addDays, startOfToday, isSameDay, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "./lib/utils";

// --- Types ---
type Step = "welcome" | "service" | "triage" | "date" | "contact" | "success";

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
}

interface TriageResult {
  analysis: string;
  recommendation: string;
  advice: string;
  urgency: "baja" | "media" | "alta";
}

// --- Constants ---
const SERVICES: Service[] = [
  { id: "pod-gen", name: "Podología General", description: "Cuidado básico de pies, uñas y piel.", icon: <Footprints className="w-5 h-5" />, duration: "30 min" },
  { id: "quiro", name: "Quiropodología", description: "Tratamiento de durezas, callos y uñas encarnadas.", icon: <Scissors className="w-5 h-5" />, duration: "45 min" },
  { id: "biomec", name: "Estudio Biomecánico", description: "Análisis de la pisada y marcha con tecnología 3D.", icon: <Activity className="w-5 h-5" />, duration: "60 min" },
];

export default function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [triageInput, setTriageInput] = useState("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  const nextStep = (next: Step) => setStep(next);
  const prevStep = (prev: Step) => setStep(prev);

  const handleTriage = async () => {
    if (!triageInput.trim()) return;
    setIsTriageLoading(true);
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: triageInput }),
      });
      const data = await response.json();
      setTriageResult(data);
      // Auto-select recommended service if it exists in our list
      const rec = SERVICES.find(s => s.name.toLowerCase().includes(data.recommendation.toLowerCase()));
      if (rec) setSelectedService(rec);
    } catch (error) {
      console.error("Error in triage:", error);
    } finally {
      setIsTriageLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService?.name,
          date: selectedDate ? format(selectedDate, "dd/MM/yyyy") : "",
          time: selectedTime,
          customer: formData
        }),
      });

      if (response.ok) {
        nextStep("success");
      } else {
        console.error("Booking error");
        alert("Hubo un error al procesar tu cita. Por favor inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-secondary font-sans selection:bg-primary/20">
      <main className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Paso 01 / Bienvenida</span>
                  <h1 className="text-6xl md:text-8xl font-display font-medium leading-[0.9] tracking-tighter">
                    Cuida tus pasos,<br />
                    <span className="italic text-primary">con calma.</span>
                  </h1>
                </div>

                <div className="grid md:grid-cols-2 gap-12 pt-8">
                  <div className="space-y-6">
                    <p className="text-xl text-secondary/80 leading-relaxed">
                      En Clínica Parrilla transformamos la salud de tus pies a través de tecnología avanzada y un trato cercano en el corazón de nuestra clínica.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => nextStep("service")}
                        className="group flex items-center justify-center gap-3 bg-secondary text-white px-8 py-5 rounded-full font-medium hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10"
                      >
                        Agendar Cita
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => nextStep("triage")}
                        className="flex items-center justify-center gap-3 border border-secondary/20 px-8 py-5 rounded-full font-medium hover:bg-primary/5 transition-all"
                      >
                        <Brain className="w-5 h-5 text-primary" />
                        ¿No sabes qué necesitas?
                      </button>
                    </div>
                  </div>
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-primary/10">
                    <img 
                      src="/src/assets/images/podology_clinic_background_1779025170031.png" 
                      alt="Clínica Parrilla"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 border-t border-secondary/10">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-primary font-bold">Podología</div>
                    <div className="font-medium">General y Quirúrgica</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-primary font-bold">Biomecánica</div>
                    <div className="font-medium">Estudio de Pisada 3D</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-primary font-bold">Ubicación</div>
                    <div className="font-medium">Calle Arroyo, 22</div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "service" && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Paso 02 / Especialidad</span>
                    <h2 className="text-4xl font-display font-medium mt-2">¿Cómo podemos ayudarte?</h2>
                  </div>
                  <button onClick={() => prevStep("welcome")} className="p-3 rounded-full border border-secondary/20 hover:bg-primary/5 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-secondary" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s); nextStep("date"); }}
                      className={cn(
                        "group flex items-start gap-4 p-6 rounded-[32px] border transition-all text-left",
                        selectedService?.id === s.id 
                          ? "bg-secondary border-secondary text-white" 
                          : "bg-white border-secondary/10 hover:border-primary"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        selectedService?.id === s.id ? "bg-white/10 text-primary" : "bg-primary/10 text-primary"
                      )}>
                        {s.icon}
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="font-bold uppercase tracking-wide text-sm">{s.name}</div>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          selectedService?.id === s.id ? "opacity-70" : "text-secondary/60"
                        )}>
                          {s.description}
                        </p>
                        <div className="text-[10px] font-mono uppercase tracking-widest pt-2">Duración: {s.duration}</div>
                      </div>
                    </button>
                  ))}
                  
                  {/* AI Triage Card */}
                  <button
                    onClick={() => nextStep("triage")}
                    className="md:col-span-2 group flex items-center justify-between p-8 rounded-[32px] border border-dashed border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-white rounded-full shadow-sm text-primary">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold uppercase tracking-wide text-sm">Asistente Inteligente</div>
                        <p className="text-sm text-secondary/60">Describe lo que sientes y te recomendaremos el mejor tratamiento.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-primary opacity-30 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "triage" && (
              <motion.div
                key="triage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IA / Triaje Virtual</span>
                    <h2 className="text-4xl font-display font-medium mt-2">Dinos qué te preocupa</h2>
                  </div>
                  <button onClick={() => prevStep("service")} className="p-3 rounded-full border border-secondary/20 hover:bg-primary/5 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white rounded-[40px] border border-secondary/10 p-10 space-y-8 shadow-xl shadow-secondary/5">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-primary pl-1">
                      Descripción de síntomas
                    </label>
                    <div className="relative">
                      <textarea
                        value={triageInput}
                        onChange={(e) => setTriageInput(e.target.value)}
                        placeholder="Ej: Tengo un dolor punzante en el talón al levantarme por las mañanas..."
                        className="w-full h-40 bg-primary/5 border-none rounded-3xl p-6 focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:opacity-30"
                      />
                      <button
                        onClick={handleTriage}
                        disabled={isTriageLoading || !triageInput.trim()}
                        className="absolute bottom-4 right-4 p-4 bg-secondary text-white rounded-2xl hover:bg-secondary/90 transition-all disabled:opacity-30"
                      >
                        {isTriageLoading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {triageResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-6 bg-secondary text-white rounded-[32px] hide-scroll"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            triageResult.urgency === "alta" ? "bg-red-400" : 
                            triageResult.urgency === "media" ? "bg-primary" : "bg-green-400"
                          )} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Recomendación Personalizada</span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="text-xs opacity-50 uppercase tracking-widest">Análisis</div>
                            <p className="text-lg font-light leading-relaxed">{triageResult.analysis}</p>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                              <div className="text-xs opacity-50 uppercase tracking-widest mb-1">Especialidad Sugerida</div>
                              <div className="text-xl font-bold font-display text-primary">{triageResult.recommendation}</div>
                            </div>
                            <button 
                              onClick={() => nextStep("date")}
                              className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all"
                            >
                              Continuar con esta cita
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {step === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Paso 03 / Fecha y Hora</span>
                    <h2 className="text-4xl font-display font-medium mt-2">¿Cuándo te viene mejor?</h2>
                  </div>
                  <button onClick={() => prevStep(triageResult ? "triage" : "service")} className="p-3 rounded-full border border-secondary/20 hover:bg-primary/5 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-[1.5fr_1fr] gap-8">
                  <div className="bg-white rounded-[40px] border border-secondary/10 p-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="font-display font-bold uppercase tracking-widest text-secondary">{format(new Date(), "MMMM yyyy", { locale: es })}</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-widest text-primary/60 text-center mb-2">
                      {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 31 }).map((_, i) => {
                        const date = addDays(startOfToday(), i);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isWeekend = getDay(date) === 0 || getDay(date) === 6;
                        
                        return (
                          <button
                            key={i}
                            disabled={isWeekend}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                              "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border",
                              isSelected 
                                ? "bg-secondary text-white border-secondary" 
                                : isWeekend 
                                  ? "opacity-20 cursor-not-allowed border-transparent"
                                  : "bg-primary/5 border-secondary/5 hover:border-primary text-secondary"
                            )}
                          >
                            <span className="text-sm font-medium">{format(date, "d")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-primary">Horas disponibles</div>
                    <div className="grid grid-cols-2 gap-3">
                      {["09:00", "10:00", "11:30", "15:00", "16:30", "18:00"].map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-4 rounded-2xl border font-mono text-sm transition-all",
                            selectedTime === time 
                              ? "bg-secondary text-white border-secondary" 
                              : "bg-white border-secondary/10 hover:border-primary text-secondary"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => nextStep("contact")}
                      className="w-full bg-secondary text-white py-6 rounded-full font-bold uppercase tracking-widest text-xs hover:tracking-[0.2em] transition-all disabled:opacity-20"
                    >
                      Continuar a tus datos
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Paso 04 / Datos de Contacto</span>
                    <h2 className="text-4xl font-display font-medium mt-2">Casi listo</h2>
                  </div>
                  <button onClick={() => prevStep("date")} className="p-3 rounded-full border border-secondary/20 hover:bg-primary/5 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-[1fr_300px] gap-8">
                  <div className="bg-white rounded-[40px] border border-secondary/10 p-10 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-primary/5 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-secondary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Teléfono</label>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-primary/5 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-secondary" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-primary/5 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-secondary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Notas adicionales (Opcional)</label>
                      <textarea 
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-primary/5 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium h-32 resize-none text-secondary" 
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-secondary text-white rounded-[32px] space-y-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Resumen de Cita</div>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <div>
                            <div className="text-[10px] opacity-40 uppercase tracking-widest">Servicio</div>
                            <div className="font-bold">{selectedService?.name}</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          <div>
                            <div className="text-[10px] opacity-40 uppercase tracking-widest">Cuándo</div>
                            <div className="font-bold">{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</div>
                            <div className="font-mono text-xs opacity-60 mt-1">{selectedTime}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleBooking}
                      disabled={!formData.name || !formData.phone}
                      className="w-full bg-primary text-secondary py-6 rounded-full font-bold uppercase tracking-widest text-xs hover:tracking-[0.2em] transition-all disabled:opacity-20 shadow-lg shadow-primary/20"
                    >
                      Confirmar Cita
                    </button>
                    <p className="text-[10px] text-center opacity-40 px-4">
                      Al confirmar, aceptas nuestra política de privacidad y términos de cancelación.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-8 py-20"
              >
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-secondary">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-6xl font-display font-medium tracking-tighter text-secondary">¡Cita Solicitada!</h2>
                  <p className="text-xl text-secondary/60 max-w-md mx-auto">
                    Tu solicitud para <span className="text-primary font-bold">{selectedService?.name}</span> ha sido recibida. Nos pondremos en contacto contigo en breve para confirmar.
                  </p>
                </div>
                <div className="pt-8">
                  <button 
                    onClick={() => {
                      setStep("welcome");
                      setTriageResult(null);
                      setTriageInput("");
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className="border border-secondary px-12 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-secondary hover:text-white transition-all"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
