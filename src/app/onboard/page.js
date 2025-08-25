'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const stores = [
  { id: 'nash_001', name: 'Nashville Downtown Gaming', fee: 5 },
  { id: 'mem_001', name: 'Memphis Beale Street', fee: 6 },
  { id: 'knox_001', name: 'Knoxville Campus Hub', fee: 4 },
];

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [agree, setAgree] = useState(false);

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', phone:'', password:'',
    storeId:'', depositAmount:50, paymentMethod:'cash'
  });

  const router = useRouter();

  const nextStep = async () => {
    setError('');
    try {
      if (step === 1) {
        // STEP 1
        setLoading(true);
        const { data } = await api.post('/api/onboarding/step1', {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password
        });
        setTempToken(data.tempToken);
        setStep(2);
      } else if (step === 2) {
        if (!agree) { setError('You must agree to the terms'); return; }
        if (!form.storeId) { setError('Select a store'); return; }
        // STEP 2
        setLoading(true);
        await api.post('/api/onboarding/step2',
          { storeId: form.storeId, agreedToTerms: true, marketingConsent: false },
          { headers: { Authorization: `Bearer ${tempToken}` } }
        );
        // STEP 3
        const { data } = await api.post('/api/onboarding/step3',
          { depositAmount: Number(form.depositAmount || 50), paymentMethod: form.paymentMethod },
          { headers: { Authorization: `Bearer ${tempToken}` } }
        );
        const token = data.accessToken || data.token;
        if (token) setToken(token);
        setStep(3);
        setTimeout(()=>router.push('/dashboard'), 900);
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gold">Welcome to Gambino</h1>
        <p className="text-zinc-400">Farm Luck. Mine Destiny.</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {[1,2,3].map(n => (
          <div key={n} className={`h-2 w-16 rounded-full ${step>=n ? 'bg-gold' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <div className="card space-y-4">
        {step === 1 && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="First name"
                value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})}/>
              <input className="input" placeholder="Last name"
                value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})}/>
            </div>
            <input className="input mt-3" type="email" placeholder="Email"
              value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
            <input className="input mt-3" type="tel" placeholder="Phone"
              value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
            <input className="input mt-3" type="password" placeholder="Password (min 6)"
              value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {stores.map(s => (
              <button key={s.id}
                className={`w-full text-left p-3 rounded-lg border ${form.storeId===s.id ? 'border-gold bg-gold/10' : 'border-zinc-800 bg-zinc-900'}`}
                onClick={()=>setForm({...form, storeId:s.id})}>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-zinc-400">Fee: {s.fee}%</div>
              </button>
            ))}
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                I agree to the terms
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" min="10" step="1"
                value={form.depositAmount} onChange={e=>setForm({...form, depositAmount:e.target.value})}/>
              <select className="input"
                value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="text-emerald-400 text-2xl font-bold">Account Created!</div>
            <div className="mt-2 text-zinc-400">You’re ready to start farming luck.</div>
            <div className="mt-4 card border-emerald-600">
              <div className="text-4xl font-extrabold text-gold">
                {Math.floor((form.depositAmount || 50) / 0.001).toLocaleString()}
              </div>
              <div className="text-zinc-400">GAMBINO Tokens Ready</div>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-between pt-2">
          <button className="btn btn-ghost" disabled={step===1} onClick={()=>setStep(step-1)}>Previous</button>
          {step < 3 ? (
            <button className="btn btn-gold" onClick={nextStep}>
              {loading ? 'Working…' : step===2 ? 'Finish & Create' : 'Continue'}
            </button>
          ) : (
            <button className="btn btn-gold" onClick={()=>router.push('/dashboard')}>Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
}
