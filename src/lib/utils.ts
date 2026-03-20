export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    'borrador': 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
    'enviada': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'en-estudio': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'aceptada': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'rechazada': 'bg-red-500/10 text-red-400 border border-red-500/20',
    'pendiente': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'pagada': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'parcial': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'vencida': 'bg-red-500/10 text-red-400 border border-red-500/20',
    'activo': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'inactivo': 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50',
    'lead': 'bg-[#E8821C]/10 text-[#E8821C] border border-[#E8821C]/20',
    'customer': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };
  return colors[estado] || 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50';
}

export function getStatusLabel(estado: string): string {
  const labels: Record<string, string> = {
    'borrador': 'Borrador',
    'enviada': 'Enviada',
    'en-estudio': 'En Estudio',
    'aceptada': 'Aceptada',
    'rechazada': 'Rechazada',
    'pendiente': 'Pendiente',
    'pagada': 'Pagada',
    'parcial': 'Pago Parcial',
    'vencida': 'Vencida',
    'lead': 'Lead',
    'customer': 'Cliente',
  };
  return labels[estado] || estado;
}

export function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    'montacarga-electrico': 'Montacarga Electrico',
    'montacarga-combustion': 'Montacarga Combustion',
    'apilador-electrico': 'Apilador Electrico',
    'traspaleta-electrica': 'Traspaleta Electrica',
    'mastil-retractil': 'Mastil Retractil',
  };
  return labels[cat] || cat;
}
