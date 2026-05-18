import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, DollarSign, Download, CreditCard, Plus, Trash2, Search, Filter, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Payments({ data, refresh, navigate }: { data: any, refresh: () => void, navigate: (tab: string) => void }) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const payments = data?.payments || [];
  const clients = data?.clients || [];
  const appointments = data?.appointments || [];
  const settings = data?.settings || {};

  const filteredPayments = payments.filter((p: any) => {
    const client = clients.find((c: any) => c.id === p.clientId);
    const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  }).sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  const totalIncome = payments.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const filteredIncome = filteredPayments.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  
  const pendingDues = appointments
    .filter((a: any) => a.paymentStatus === 'unpaid')
    .reduce((acc: number, cur: any) => acc + (cur.fee || settings.fee), 0);

  const handleLogPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const clientId = formData.get('clientId') as string;
    const method = formData.get('method') as string;

    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          amount,
          method,
          paidAt: new Date().toISOString()
        })
      });
      refresh();
      setIsLogOpen(false);
      toast.success('Payment recorded');
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.success('Payment record deleted');
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error('Failed to delete payment');
    }
  };

  const handleDownloadCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    const headers = ["Client Name", "Amount", "Method", "Date", "Time"];
    const rows = filteredPayments.map((p: any) => {
      const client = data.clients.find((c: any) => c.id === p.clientId);
      const date = new Date(p.paidAt);
      return [
        `"${client?.name || 'Patient'}"`,
        p.amount,
        p.method,
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss')
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `LUMA_OS_Payments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded');
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-text-main">Finance</h2>
          <p className="text-text-muted text-sm font-medium tracking-tight">Your practice yield</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            className="w-12 h-12 rounded-2xl bg-card border border-border-soft flex items-center justify-center text-text-muted shadow-sm hover:bg-background transition-all"
            title="Download CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger 
              className="w-12 h-12 rounded-2xl bg-primary-pink text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
              title="Log Payment"
            >
              <Plus className="w-5 h-5" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[32px] border-border-soft shadow-xl p-8 bg-card overflow-hidden">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold tracking-tight text-text-main">Log Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogPayment} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Patient</Label>
                  <Select name="clientId" required>
                    <SelectTrigger className="h-14 rounded-2xl border-border-soft bg-background text-text-main font-medium">
                      <SelectValue placeholder="Select Patient" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border-soft bg-card">
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-text-main font-medium">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Amount (₹)</Label>
                  <Input name="amount" type="number" defaultValue={settings.fee} required className="h-14 rounded-2xl border-border-soft bg-background px-6 font-semibold text-text-main" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted ml-1">Method</Label>
                  <Select name="method" defaultValue="UPI">
                    <SelectTrigger className="h-14 rounded-2xl border-border-soft bg-background text-text-main font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border-soft bg-card">
                      <SelectItem value="UPI" className="text-text-main font-medium">UPI / GPay</SelectItem>
                      <SelectItem value="Cash" className="text-text-main font-medium">Cash</SelectItem>
                      <SelectItem value="Bank" className="text-text-main font-medium">Bank Transfer</SelectItem>
                      <SelectItem value="Card" className="text-text-main font-medium">Card Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-primary-sage font-bold text-text-main shadow-lg active:scale-95 transition-all mt-4">
                  Record Log
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Simplified Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none bg-primary-sage/10 rounded-3xl p-8 group">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-primary-sage rounded-full" />
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Received</p>
            </div>
            <div className="text-5xl font-bold tracking-tight text-text-main">
              ₹{totalIncome.toLocaleString()}
              {methodFilter !== 'all' || searchTerm ? (
                <span className="text-lg opacity-40 ml-3">/ ₹{filteredIncome.toLocaleString()} filtered</span>
              ) : null}
            </div>
            <p className="text-primary-sage text-sm font-semibold italic">Clinical yield this period</p>
          </div>
        </Card>

        <Card className="border border-stone-100 bg-white dark:bg-card rounded-3xl p-8">
          <div className="space-y-4">
            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Pending Arrears</p>
            <div className="text-5xl font-bold tracking-tight text-amber-600">₹{pendingDues.toLocaleString()}</div>
            <p className="text-text-muted text-sm font-medium">Clear from appointment feed</p>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
          <Input 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-14 rounded-2xl border-border-soft bg-card font-medium text-text-main"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="h-14 rounded-2xl border-border-soft bg-card font-medium text-text-main">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 opacity-50" />
                <SelectValue placeholder="Method" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border-soft bg-card">
              <SelectItem value="all" className="font-medium text-text-main">All Methods</SelectItem>
              <SelectItem value="UPI" className="font-medium text-text-main">UPI / GPay</SelectItem>
              <SelectItem value="Cash" className="font-medium text-text-main">Cash</SelectItem>
              <SelectItem value="Bank" className="font-medium text-text-main">Bank Transfer</SelectItem>
              <SelectItem value="Card" className="font-medium text-text-main">Card Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-muted px-1 uppercase tracking-wider">Transaction Journal</h3>
        
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-3xl border border-border-soft shadow-sm flex flex-col items-center">
               <DollarSign className="w-10 h-10 text-text-muted opacity-20 mb-4" />
               <p className="text-text-muted font-medium">No recorded transactions found</p>
            </div>
          ) : (
            filteredPayments.map((p: any) => (
              <div key={p.id} className="bg-card rounded-3xl p-6 flex items-center justify-between border border-border-soft shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-text-main">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-lg font-bold text-text-main tracking-tight">
                      {data.clients.find((c: any) => c.id === p.clientId)?.name || 'Patient'}
                    </h4>
                    <p className="text-xs font-medium text-text-muted opacity-80">{format(new Date(p.paidAt), 'MMM do, p')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right space-y-0.5">
                    <p className="text-xl font-bold text-text-main tracking-tight">+₹{p.amount.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-1.5 h-1.5 bg-primary-sage rounded-full" />
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{p.method}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const client = data.clients.find((c: any) => c.id === p.clientId);
                      if (client?.phone) {
                        const phone = client.phone.replace(/\D/g, '');
                        const text = `Hi ${client.name},\n\nPayment of ₹${p.amount} has been received successfully.\n\nThank you.\n\nAuto-generated by LUMA OS`;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-primary-sage/10 text-primary-sage flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-sage hover:text-white"
                    title="Send Receipt"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeletePayment(p.id)}
                    className="w-10 h-10 rounded-xl bg-primary-pink/10 text-primary-pink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-pink hover:text-white"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

