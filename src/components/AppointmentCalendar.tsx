import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, Plus as PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AppointmentCalendar({ data, refresh, navigate }: { data: any, refresh: () => void, navigate: (tab: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value;
    setStartTime(start);
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(hours + 1);
    date.setMinutes(minutes);
    const end = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    setEndTime(end);
  };

  const events = data.appointments.map((apt: any) => ({
    id: apt.id,
    title: apt.clientName,
    start: `${apt.date}T${apt.startTime}`,
    end: `${apt.date}T${apt.endTime}`,
    backgroundColor: apt.status === 'completed' ? '#E5E7EB' : '#A7C4A0',
    borderColor: 'transparent',
    textColor: apt.status === 'completed' ? '#6B7280' : '#FFFFFF',
    extendedProps: { ...apt }
  }));

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setIsModalOpen(true);
  };

  const handleAddAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('clientId') as string;
    const client = data.clients.find((c: any) => c.id === clientId);

    const baseAppointment = {
      clientId,
      clientName: client?.name || 'Unknown',
      date: formData.get('date') as string,
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      sessionType: formData.get('sessionType'),
      fee: Number(formData.get('fee')) || data.settings.fee,
      status: 'upcoming',
      paymentStatus: 'unpaid',
      notes: ''
    };

    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseAppointment)
      });
      refresh();
      setIsModalOpen(false);
      toast.success('Appointment scheduled');
    } catch (e) {
      toast.error('Failed to schedule session');
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-10 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-text-main">Calendar</h2>
          <p className="text-text-muted text-sm font-medium tracking-tight">Manage your weekly practice</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="w-12 h-12 rounded-2xl bg-primary-pink text-white shadow-lg active:scale-90 transition-all flex items-center justify-center">
            <PlusIcon className="w-6 h-6" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-[32px] border-border-soft shadow-xl p-8 bg-card overflow-hidden">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold tracking-tight text-text-main">Schedule Session</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddAppointment} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-medium focus:ring-primary-sage/20">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border-soft bg-card">
                    {data.clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="font-medium text-text-main">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Date</Label>
                <Input 
                  name="date" 
                  type="date" 
                  defaultValue={selectedDate} 
                  required 
                  className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-medium focus:ring-primary-sage/20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Start</Label>
                  <Input 
                    name="startTime" 
                    type="time" 
                    value={startTime} 
                    onChange={handleStartTimeChange}
                    required 
                    className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-medium focus:ring-primary-sage/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">End</Label>
                  <Input 
                    name="endTime" 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                    className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-medium focus:ring-primary-sage/20" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Session Fee (₹)</Label>
                <Input 
                  name="fee" 
                  type="number" 
                  defaultValue={data.settings.fee} 
                  required 
                  className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-medium focus:ring-primary-sage/20" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 rounded-2xl h-14 bg-primary-sage text-white font-semibold shadow-md active:scale-95 transition-all">
                  Schedule
                </Button>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 px-6 border-border-soft text-text-muted">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border border-border-soft shadow-sm rounded-3xl bg-white overflow-hidden text-black">
          <CardContent className="p-4 md:p-8">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek'}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              expandRows={true}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              events={events}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              slotDuration="00:30:00"
              allDaySlot={false}
              height={750}
              nowIndicator={true}
              dayMaxEvents={true}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              dayHeaderFormat={{ weekday: 'long', day: 'numeric' }}
              eventContent={(eventInfo) => (
                <div className="p-4 h-full flex flex-col justify-center overflow-hidden border-l-4 border-black/10">
                  <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest mb-1">{format(eventInfo.event.start!, 'p')}</p>
                  <p className="text-[14px] font-bold text-slate-900 truncate tracking-tight">{eventInfo.event.title}</p>
                  {eventInfo.event.extendedProps.sessionType && (
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-1">{(eventInfo.event.extendedProps.sessionType as string).split(' ')[0]}</p>
                  )}
                </div>
              )}
              themeSystem="standard"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
