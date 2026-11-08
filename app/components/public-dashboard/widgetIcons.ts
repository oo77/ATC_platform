/**
 * Иконки виджетов публичного дашборда (явный список, чтобы не тянуть весь lucide в бандл)
 */
import {
  Activity, Award, BadgeCheck, BarChart3, BookOpen, Building2, CalendarClock, CalendarDays,
  CalendarPlus, ClipboardCheck, Clock, Flag, GraduationCap, Inbox, Layers, LayoutGrid, Megaphone,
  Percent, PieChart, Presentation, ShieldCheck, Target, TrendingUp, Trophy, UserCheck, UserPlus, Users,
  AlertTriangle, CalendarRange, ClipboardX, DoorClosed, DoorOpen, Radio, UserCog,
} from "lucide-vue-next";
import type { Component } from "vue";

const ICONS: Record<string, Component> = {
  Activity, Award, BadgeCheck, BarChart3, BookOpen, Building2, CalendarClock, CalendarDays,
  CalendarPlus, ClipboardCheck, Clock, Flag, GraduationCap, Inbox, Layers, Megaphone,
  Percent, PieChart, Presentation, ShieldCheck, Target, TrendingUp, Trophy, UserCheck, UserPlus, Users,
  AlertTriangle, CalendarRange, ClipboardX, DoorClosed, DoorOpen, Radio, UserCog,
};

export function widgetIcon(name: string | undefined): Component {
  return (name && ICONS[name]) || LayoutGrid;
}
