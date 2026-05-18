import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Settings({ data, refresh, navigate, darkMode, onToggleDarkMode }: { data: any, refresh: () => void, navigate: (tab: string) => void, darkMode: boolean, onToggleDarkMode: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      therapistName: formData.get('therapistName'),
      sessionDuration: Number(formData.get('sessionDuration')),
      fee: Number(formData.get('fee')),
      meetingLink: formData.get('meetingLink'),
      workingHours: {
        start: formData.get('workStart'),
        end: formData.get('workEnd'),
      }
    };

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      refresh();
      toast.success('Preferences saved');
    } catch (e) {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-text-main">Settings</h2>
          <p className="text-text-muted text-sm font-medium tracking-tight">Your practice preferences</p>
        </div>
      </header>

      <form key={JSON.stringify(data.settings)} onSubmit={handleUpdateSettings} className="space-y-8">
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-text-muted px-1 uppercase tracking-wider">Clinical Profile</h3>
          <Card className="rounded-3xl border border-border-soft shadow-sm bg-card overflow-hidden p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="therapistName" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Practice Name</Label>
                <Input name="therapistName" defaultValue={data.settings.therapistName} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Default Fee (₹)</Label>
                  <Input name="fee" type="number" defaultValue={data.settings.fee} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingLink" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Online Meeting Link</Label>
                  <Input name="meetingLink" placeholder="Zoom, Meet, etc." defaultValue={data.settings.meetingLink} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration" className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Session Length (min)</Label>
                  <Input name="sessionDuration" type="number" defaultValue={data.settings.sessionDuration} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-text-muted px-1 uppercase tracking-wider">Operational Hours</h3>
          <Card className="rounded-3xl border border-border-soft shadow-sm bg-card p-8">
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Start</Label>
                 <Input name="workStart" type="time" defaultValue={data.settings.workingHours.start} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold text-center" />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">End</Label>
                 <Input name="workEnd" type="time" defaultValue={data.settings.workingHours.end} className="rounded-2xl border-border-soft bg-background h-14 px-6 text-text-main font-semibold text-center" />
               </div>
             </div>
          </Card>
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-text-muted px-1 uppercase tracking-wider">Features</h3>
          <Card className="rounded-3xl border border-border-soft shadow-sm bg-card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-text-main tracking-tight">Dark Mode</p>
                <p className="text-sm text-text-muted">Use a softer dark theme</p>
              </div>
              <Switch 
                checked={darkMode} 
                onCheckedChange={onToggleDarkMode}
                className="data-[state=checked]:bg-primary-sage" 
              />
            </div>
          </Card>
        </section>

        <Button type="submit" disabled={loading} className="w-full rounded-2xl h-16 bg-primary-sage text-white font-semibold shadow-md active:scale-95 transition-all mt-4">
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </form>
    </div>
  );
}
