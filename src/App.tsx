/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Users, CreditCard, Settings as SettingsIcon, Plus } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';

// Screens (Components)
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import Clients from './components/Clients';
import Payments from './components/Payments';
import Settings from './components/Settings';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const DEFAULT_DATA = {
    clients: [],
    appointments: [],
    payments: [],
    settings: {
      therapistName: "Clinical Practice",
      sessionDuration: 60,
      workingHours: { start: "09:00", end: "17:00" },
      fee: 1500,
      meetingLink: ""
    }
  };

  const [data, setData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('serene_data');
      return saved ? JSON.parse(saved) : DEFAULT_DATA;
    }
    return DEFAULT_DATA;
  });
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  const fetchData = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/db');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      localStorage.setItem('serene_data', JSON.stringify(json));
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
      console.warn('API error, using local data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Initialize dark mode from local storage
    const savedTheme = localStorage.getItem('luma_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('luma_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luma_theme', 'light');
    }
  };

  const renderScreen = () => {
    if (loading) return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );

    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} refresh={fetchData} navigate={setActiveTab} />;
      case 'calendar': return <AppointmentCalendar data={data} refresh={fetchData} navigate={setActiveTab} />;
      case 'clients': return <Clients data={data} refresh={fetchData} navigate={setActiveTab} />;
      case 'payments': return <Payments data={data} refresh={fetchData} navigate={setActiveTab} />;
      case 'settings': return <Settings data={data} refresh={fetchData} navigate={setActiveTab} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
      default: return <Dashboard data={data} refresh={fetchData} navigate={setActiveTab} />;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Give time for transition to finish then trigger resize
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350);
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col font-sans transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'}`}>
      {/* App Header for Mobile */}
      <header className="md:hidden sticky top-0 bg-background/80 backdrop-blur-xl px-4 py-5 flex items-center justify-between z-40">
        <div className="space-y-0.5 text-left">
          <p className="text-text-muted text-[12px] font-medium tracking-tight">Good Morning</p>
          <h1 className="text-text-main text-xl font-semibold tracking-tight">
            {data?.settings?.therapistName?.split(' ')[0] || 'Luma'}
          </h1>
        </div>
        <button 
          onClick={() => setActiveTab('settings')} 
          className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-text-muted shadow-sm active:scale-95 transition-all"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 bg-card border-r border-border-soft hidden md:flex flex-col z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className={`flex items-center justify-between px-5 py-6 mb-8`}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary-blue/30 rounded-xl blur-sm" />
                <div className="relative w-full h-full bg-card rounded-xl shadow-sm border border-border-soft flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-primary-sage" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-pink rounded-full flex items-center justify-center shadow-sm">
                    <Plus className="w-2.5 h-2.5 text-white stroke-[3px]" />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold tracking-tight text-text-main uppercase tracking-tighter">LUMA OS</h1>
                <p className="text-text-muted text-[9px] font-bold uppercase tracking-[1.5px]">Therapy Practice</p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary-blue/30 rounded-xl blur-sm" />
                <div className="relative w-full h-full bg-card rounded-xl shadow-sm border border-border-soft flex items-center justify-center">
                  <span className="text-primary-sage font-bold text-sm">L</span>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg hover:bg-background text-text-muted transition-colors ${!sidebarOpen ? 'absolute -right-4 top-7 bg-card border border-border-soft shadow-sm z-50 rounded-full' : ''}`}
          >
             <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }}>
               <Plus className="w-4 h-4 rotate-45" />
             </motion.div>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto hide-scrollbar">
          <NavItem icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} collapsed={!sidebarOpen} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={CalendarIcon} label="Calendar" active={activeTab === 'calendar'} collapsed={!sidebarOpen} onClick={() => setActiveTab('calendar')} />
          <NavItem icon={Plus} label="Quick Add" active={false} collapsed={!sidebarOpen} onClick={() => setIsQuickAddOpen(true)} className="text-primary-pink hover:bg-primary-pink/5" />
          <div className="h-px bg-gray-100 my-4 mx-2" />
          <NavItem icon={Users} label="Clients" active={activeTab === 'clients'} collapsed={!sidebarOpen} onClick={() => setActiveTab('clients')} />
          <NavItem icon={CreditCard} label="Payments" active={activeTab === 'payments'} collapsed={!sidebarOpen} onClick={() => setActiveTab('payments')} />
          <NavItem icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} collapsed={!sidebarOpen} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto p-4 animate-in fade-in duration-500">
          <div className={`p-3 bg-background rounded-xl border border-border-soft flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-primary-sage shadow-[0_0_8px_rgba(168,228,208,0.8)]' : 'bg-primary-yellow animate-pulse shadow-[0_0_8px_rgba(255,227,122,0.8)]'}`} />
            {sidebarOpen && <p className="text-[12px] font-medium text-text-muted capitalize tracking-tight">{syncStatus}</p>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow w-full mx-auto px-4 py-4 md:py-16 pb-32 md:pb-16 transition-all duration-500 ${sidebarOpen ? 'md:px-12 max-w-[1600px]' : 'md:px-6 max-w-full'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - Floating Soft Dock */}
      <nav className="fixed bottom-5 left-4 right-4 h-16 md:hidden bg-card/95 backdrop-blur-xl border border-border-soft shadow-lg rounded-2xl flex items-center justify-around px-2 z-50">
        <MobileNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={CalendarIcon} label="Calendar" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        
        <div className="relative -top-0">
           <button 
            onClick={() => setIsQuickAddOpen(true)}
            className="w-12 h-12 bg-primary-pink rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all duration-300"
           >
            <Plus className="w-6 h-6" />
           </button>
        </div>

        <MobileNavItem icon={CreditCard} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
        <MobileNavItem icon={Users} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
      </nav>

      {/* Quick Add Appointment Dialog Placeholder (I'll implement the actual form in a moment if needed or use the one in Calendar) */}
      {/* For now, let's keep it simple and maybe just reuse AppointmentCalendar's logic via a prop or similar */}

      {/* Quick Add Appointment Sheet */}
      <Sheet open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 pb-12">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold tracking-tight">Quick Add</SheetTitle>
            <SheetDescription>Preserve your practice flow. Add a session instantly.</SheetDescription>
          </SheetHeader>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clientId = formData.get('clientId') as string;
              if (!clientId) {
                toast.error('Please select a patient');
                return;
              }
              const client = data.clients.find((c: any) => c.id === clientId);
              
              const startTime = formData.get('startTime') as string;
              const [hours, minutes] = startTime.split(':').map(Number);
              const duration = data.settings.sessionDuration || 60;
              const endMinutes = minutes + duration;
              const endHours = hours + Math.floor(endMinutes / 60);
              const finalEndMinutes = endMinutes % 60;
              const endTime = `${String(endHours).padStart(2, '0')}:${String(finalEndMinutes).padStart(2, '0')}`;

              const baseAppointment = {
                clientId,
                clientName: client?.name || 'Quick Patient',
                date: new Date().toISOString().split('T')[0], // Default today
                startTime,
                endTime,
                sessionType: 'Standard Session',
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
                fetchData();
                setIsQuickAddOpen(false);
                toast.success('Session added to flow');
              } catch (err) {
                toast.error('Failed to add session');
              }
            }} 
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Patient</Label>
              <Select name="clientId" required>
                <SelectTrigger className="h-14 rounded-2xl border-border-soft bg-background text-text-main font-medium focus:ring-primary-sage/20">
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border-soft bg-card">
                  {data?.clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-text-main font-medium cursor-pointer">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Time</Label>
                <Input name="startTime" type="time" defaultValue="09:00" className="h-14 rounded-2xl border-border-soft bg-background px-4 font-semibold text-text-main" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-0.5">Fee (₹)</Label>
                <Input name="fee" type="number" defaultValue={data?.settings?.fee} className="h-14 rounded-2xl border-border-soft bg-background px-4 font-semibold text-text-main" required />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary-pink font-bold text-white shadow-lg active:scale-95 transition-all mt-4">
              Add Session
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active, collapsed, onClick, className = '' }: { icon: any, label: string, active: boolean, collapsed?: boolean, onClick: () => void, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center rounded-xl transition-all duration-200 ${collapsed ? 'justify-center py-4' : 'space-x-3.5 px-4 py-3.5'} ${
        active 
          ? 'bg-primary-sage/10 text-text-main font-semibold' 
          : 'text-text-muted hover:bg-background font-medium'
      } ${className}`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary-sage' : 'opacity-60'}`} />
      {!collapsed && <span className="text-[14px] tracking-tight">{label}</span>}
    </button>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${
        active ? 'text-primary-sage scale-105' : 'text-text-muted'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
      <span className="text-[10px] font-medium tracking-tight">{label}</span>
    </button>
  );
}
