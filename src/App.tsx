import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  ArrowRightLeft,
  FileText,
  Home,
  History,
  User,
  ArrowLeft,
  CreditCard,
  Building2,
  MapPin
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { parseLankaQR, type LankaQRData } from './lib/qr-parser';

type AppState = 'DASHBOARD' | 'SCANNER' | 'DETAILS' | 'ACCOUNT_SELECTION' | 'CONFIRMATION' | 'SUCCESS';

interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
}

const DEMO_ACCOUNTS: Account[] = [
  { id: '1', name: 'Savings Account', number: 'xxxx1234', balance: 50250.00 },
  { id: '2', name: 'Current Account', number: 'xxxx5678', balance: 125000.00 },
  { id: '3', name: 'Flash Savings', number: 'xxxx9012', balance: 5500.00 },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('DASHBOARD');
  const [qrData, setQrData] = useState<LankaQRData | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [refNo, setRefNo] = useState<string>('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === 'SCANNER') {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 320, height: 320 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          // prefer back camera
          videoConstraints: {
            facingMode: 'environment'
          }
        },
        /* verbose= */ false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Scanner cleanup failed", error);
        });
      }
    };
  }, [state]);

  const onScanSuccess = (decodedText: string) => {
    console.log("Scan Success:", decodedText);
    const parsed = parseLankaQR(decodedText);
    if (parsed) {
      setQrData(parsed);
      setAmount(parsed.amount || '');
      setRefNo(parsed.reference || '');
      if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
          setState('DETAILS');
        });
      } else {
        setState('DETAILS');
      }
    } else {
      alert("Invalid LankaQR format");
    }
  };

  const onScanFailure = () => {
    // console.warn(`Code scan error = ${error}`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("reader");
      const decodedText = await html5QrCode.scanFileV2(file, false);
      onScanSuccess(decodedText.decodedText);
    } catch (err) {
      console.error("Error scanning file:", err);
      alert("No QR code found in this image. Please try another one.");
    }
  };

  const handlePay = () => {
    setState('SUCCESS');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CE1126', '#FFFFFF', '#A50E1F']
    });
  };

  const renderDashboard = () => (
    <div className="main-content">
      <div className="account-card">
        <div className="account-label">Total Balance</div>
        <div className="account-balance">LKR 180,750.00</div>
        <div className="account-number">
          Last login: Today, {new Date(Date.now() - 30 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
      </div>

      <h2 className="dashboard-title">Quick Actions</h2>
      <div className="action-grid">
        <div className="action-card">
          <div className="action-icon"><ArrowRightLeft size={24} /></div>
          <div className="action-label">Fund Transfer</div>
        </div>
        <div className="action-card">
          <div className="action-icon"><FileText size={24} /></div>
          <div className="action-label">Pay Bills</div>
        </div>
        <div className="action-card" onClick={() => setState('SCANNER')}>
          <div className="action-icon"><Scan size={24} /></div>
          <div className="action-label">Scan & Pay</div>
        </div>
      </div>

      <h2 className="dashboard-title">Recent Transactions</h2>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="action-icon" style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', color: '#666' }}>
          <Building2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Cargills Supermarket</div>
          <div style={{ fontSize: 12, color: '#666' }}>Yesterday, 06:45 PM</div>
        </div>
        <div style={{ fontWeight: 700, color: '#CE1126' }}>- LKR 4,250.00</div>
      </div>
    </div>
  );

  const renderScanner = () => (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setState('DASHBOARD')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>Scan LankaQR</h2>
      </div>

      <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
        Align the QR code within the frame to pay
      </p>

      <div className="scanner-container">
        <div id="reader"></div>
      </div>

      <div style={{ marginTop: 24 }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
          Upload QR
        </button>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setState('SCANNER')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0 }}>Payment Details</h2>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Merchant Name</label>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} />
              {qrData?.merchant_name}
            </div>
          </div>


          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>City</label>
            <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={16} color="#666" />
              {qrData?.merchant_city}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Amount (LKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="btn-outline"
              style={{ width: '100%', padding: '12px', fontSize: '24px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--border)' }}
              placeholder="0.00"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Reference Number</label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              className="btn-outline"
              style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
        <button className="btn btn-secondary" onClick={() => setState('SCANNER')}>Cancel</button>
        <button className="btn btn-primary" onClick={() => setState('ACCOUNT_SELECTION')}>Confirm</button>
      </div>
    </div>
  );

  const renderAccountSelection = () => (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setState('DETAILS')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>Select Account</h2>
      </div>

      <p style={{ color: '#666', marginBottom: 16 }}>Choose the account to pay from</p>

      {DEMO_ACCOUNTS.map(acc => (
        <div
          key={acc.id}
          className="card"
          onClick={() => {
            setSelectedAccount(acc);
            setState('CONFIRMATION');
          }}
          style={{
            cursor: 'pointer',
            border: selectedAccount?.id === acc.id ? '2px solid var(--primary)' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div className="action-icon">
            <CreditCard size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{acc.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{acc.number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Balance</div>
            <div style={{ fontWeight: 700 }}>LKR {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setState('DETAILS')}>Back</button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setState('ACCOUNT_SELECTION')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>Review Payment</h2>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Paying to</div>
        <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--primary)', marginBottom: 24 }}>{qrData?.merchant_name}</div>

        <div style={{ height: 1, backgroundColor: '#eee', marginBottom: 24 }}></div>

        <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 600, verticalAlign: 'super', marginRight: 4 }}>LKR</span>
          {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 14, color: '#666' }}>{refNo ? `Ref: ${refNo}` : 'No Reference'}</div>
      </div>

      <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>From Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CreditCard size={20} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600 }}>{selectedAccount?.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{selectedAccount?.number}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={handlePay}>Pay Now</button>
        <button className="btn btn-secondary" onClick={() => setState('DASHBOARD')}>Cancel</button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className={`success-checkmark`}>
        <div className="circle-loader load-complete">
          <div className="checkmark draw"></div>
        </div>
      </div>

      <h1 style={{ color: 'var(--success)', marginBottom: 8 }}>Payment Successful!</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Your transaction has been processed</p>

      <div className="card" style={{ width: '100%', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: '#666' }}>Date & Time</span>
          <span style={{ fontWeight: 600 }}>{new Date().toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: '#666' }}>Merchant</span>
          <span style={{ fontWeight: 600 }}>{qrData?.merchant_name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: '#666' }}>Amount</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>LKR {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>Reference</span>
          <span style={{ fontWeight: 600 }}>{refNo || 'N/A'}</span>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => setState('DASHBOARD')}>Done</button>
    </div>
  );

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">C</div>
          Cargills Bank
        </div>
        <User size={24} color="#666" />
      </header>

      {state === 'DASHBOARD' && renderDashboard()}
      {state === 'SCANNER' && renderScanner()}
      {state === 'DETAILS' && renderDetails()}
      {state === 'ACCOUNT_SELECTION' && renderAccountSelection()}
      {state === 'CONFIRMATION' && renderConfirmation()}
      {state === 'SUCCESS' && renderSuccess()}

      <nav className="bottom-nav">
        <a href="#" className={`nav-item ${state === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setState('DASHBOARD')}>
          <Home size={24} />
          <span>Home</span>
        </a>
        <a href="#" className={`nav-item ${state === 'SCANNER' ? 'active' : ''}`} onClick={() => setState('SCANNER')}>
          <Scan size={24} />
          <span>Scan</span>
        </a>
        <a href="#" className="nav-item">
          <History size={24} />
          <span>History</span>
        </a>
        <a href="#" className="nav-item">
          <User size={24} />
          <span>Profile</span>
        </a>
      </nav>
    </div>
  );
};

export default App;
