import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Calendar as CalendarIcon, MessageSquare, CreditCard } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { toast } from 'sonner';

export default function Dashboard({ data, refresh, navigate }: { data: any, refresh: () => void, navigate: (tab: string) => void }) {
  const today = new Date();
  const todayAppointments = data.appointments.filter((a: any) => isSameDay(new Date(a.date), today));
  const pendingPayments = data.appointments.filter((a: any) => a.paymentStatus === 'unpaid' && new Date(a.date) <= today);
  const nextAppointment = data.appointments
    .filter((a: any) => new Date(a.date) >= today && a.status === 'upcoming')
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      refresh();
      toast.success(`Session marked as ${status}`);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const markAsPaid = async (appointment: any) => {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          amount: appointment.fee || data.settings.fee,
          method: 'Cash'
        })
      });
      await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' })
      });
      refresh();
      toast.success('Payment recorded');
    } catch (e) {
      toast.error('Payment failed');
    }
  };

  const completeFlow = async (apt: any) => {
    try {
      // 1. Mark as completed
      await fetch(`/api/appointments/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      // 2. Refresh & Toast
      refresh();
      toast.success('Session completed');
    } catch (e) {
      toast.error('Failed to complete session');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 text-left">
      {/* Quick Access Next Session Bar */}
      {nextAppointment && (
        <div className="sticky top-0 z-20 -mx-4 md:-mx-0 md:mb-12">
          <div 
            onClick={() => completeFlow(nextAppointment)}
            className="group cursor-pointer bg-gradient-to-r from-primary-blue via-primary-blue/90 to-primary-sage p-4 md:rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-[0.98] border border-white/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Clock className="w-5 h-5 text-text-main" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-main/60">Next Session • {nextAppointment.startTime}</p>
                <h3 className="text-lg font-bold tracking-tight text-text-main">{nextAppointment.clientName}</h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-text-main/70 group-hover:text-text-main transition-colors">Start Session</span>
              <div className="w-8 h-8 rounded-lg bg-primary-pink flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="space-y-1 px-1 md:hidden">
        <p className="text-text-muted text-xs font-bold uppercase tracking-widest">{format(today, 'EEEE, MMMM do')}</p>
      </header>

      {/* Main Stats/Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-12 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-[2px]">Daily Roster</h2>
            <span className="text-[10px] font-bold text-primary-sage bg-primary-sage/20 px-2 py-0.5 rounded-md border border-primary-sage/30">{todayAppointments.length} sessions</span>
          </div>

          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="py-20 bg-card rounded-3xl border border-border-soft shadow-sm flex flex-col items-center justify-center space-y-3">
                 <div className="w-16 h-16 bg-primary-sage/10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-primary-sage/40" />
                 </div>
                 <p className="text-text-muted text-sm font-bold uppercase tracking-wider">Your day is clear</p>
              </div>
            ) : (
              todayAppointments.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)).map((apt: any) => (
                <div key={apt.id} className={`bg-card rounded-2xl border border-border-soft/60 p-5 flex items-center justify-between shadow-sm group active:scale-[0.99] transition-all duration-300 ${apt.status === 'completed' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-bold text-text-main tracking-tight">{apt.startTime.split(':')[0]}<span className="text-xs opacity-50">:{apt.startTime.split(':')[1]}</span></p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{parseInt(apt.startTime) >= 12 ? 'PM' : 'AM'}</p>
                    </div>
                    <div className="h-8 w-px bg-border-soft hidden md:block" />
                    <div className="space-y-0.5 text-left">
                      <h4 className={`text-lg font-bold tracking-tight ${apt.status === 'completed' ? 'line-through text-text-muted' : 'text-text-main'}`}>
                        {apt.clientName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-text-muted opacity-60 uppercase tracking-widest">{apt.sessionType}</span>
                        {apt.paymentStatus === 'unpaid' && apt.status === 'completed' && (
                           <span className="w-1.5 h-1.5 bg-primary-pink rounded-full animate-pulse shadow-[0_0_8px_rgba(251,163,191,0.8)]" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const client = data.clients.find((c: any) => c.name === apt.clientName);
                        if (client?.phone) {
                          const phone = client.phone.replace(/\D/g, '');
                          const text = `Hi ${apt.clientName},\n\nJust a gentle reminder about your appointment today.\n\n⏰ ${apt.startTime}\n\nLooking forward to seeing you.\n\nAuto-generated by LUMA OS`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                        } else {
                          toast.error('No phone number found');
                        }
                      }}
                      className="w-11 h-11 rounded-xl bg-primary-blue/10 text-primary-sage hover:bg-primary-blue/20 flex items-center justify-center shadow-sm active:scale-90 transition-all border border-primary-blue/20"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    {apt.paymentStatus === 'unpaid' && apt.status === 'completed' && (
                      <button 
                        onClick={() => markAsPaid(apt)}
                        className="w-9 h-9 rounded-xl bg-primary-pink/10 text-primary-pink flex items-center justify-center shadow-sm hover:scale-105 transition-transform border border-primary-pink/20"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status !== 'completed' ? (
                      <button 
                        onClick={() => completeFlow(apt)}
                        className="w-11 h-11 rounded-xl bg-primary-sage/10 text-primary-sage hover:bg-primary-sage hover:text-white flex items-center justify-center shadow-sm active:scale-90 transition-all border border-primary-sage/20"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary-sage/5 flex items-center justify-center text-primary-sage">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {pendingPayments.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-text-muted px-1 uppercase tracking-[2px]">Financial Clarity</h2>
          <Card className="rounded-3xl border border-primary-yellow/30 bg-primary-yellow/5 dark:bg-primary-yellow/10 overflow-hidden shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-text-main font-bold text-lg">{pendingPayments.length} Open Invoices</p>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider tracking-widest">Pending clinic yield needs review</p>
              </div>
              <Button 
                onClick={() => navigate('payments')}
                className="bg-primary-yellow hover:bg-primary-yellow/90 text-text-main rounded-xl active:scale-95 transition-all text-[10px] font-bold uppercase tracking-widest px-6 shadow-sm border border-primary-yellow/50"
              >
                Review
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
