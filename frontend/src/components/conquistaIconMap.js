import { Award, CalendarDays, CheckCircle2, FileQuestion, Flame, Sparkles, Star, Target, Timer, Trophy } from 'lucide-react'

// Mapa slug-de-ícone (string vinda do backend) -> componente lucide.
export const ICON_MAP = {
  Sparkles, Flame, Target, FileQuestion, Trophy, Award, CheckCircle2, Timer, Star, CalendarDays,
}

export const iconFor = (name) => ICON_MAP[name] || Award
