import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase, toCamelCase, toSnakeCase } from './lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const defaultCustomers = [];
const defaultVisaApplications = [];
const defaultTours = [];
const defaultHotels = [];
const defaultHotelReservations = [];
const defaultUsers = [{ id: 1, email: 'onder@paydostur.com', password: '123456', name: 'Önder', role: 'admin' }];

const turkishProvinces = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'];
const sectors = ['Adalet ve Güvenlik', 'Ağaç İşleri, Kağıt ve Kağıt Ürünleri', 'Bilişim Teknolojileri', 'Cam, Çimento ve Toprak', 'Çevre', 'Devlet Memuru', 'Eğitim', 'Elektrik ve Elektronik', 'Enerji', 'Finans', 'Gıda', 'İnşaat', 'İş ve Yönetim', 'Kimya, Petrol, Lastik ve Plastik', 'Kültür, Sanat ve Tasarım', 'Maden', 'Makine', 'Medya, İletişim ve Yayıncılık', 'Metal', 'Otomotiv', 'Sağlık ve Sosyal Hizmetler', 'Spor ve Rekreasyon', 'Tarım, Avcılık ve Balıkçılık', 'Tekstil, Hazır Giyim, Deri', 'Ticaret (Satış ve Pazarlama)', 'Toplumsal ve Kişisel Hizmetler', 'Turizm, Konaklama, Yiyecek-İçecek Hizmetleri', 'Ulaştırma, Lojistik ve Haberleşme'];
const passportTypes = ['Bordo Pasaport (Umuma Mahsus)', 'Yeşil Pasaport (Hususi)', 'Gri Pasaport (Hizmet)', 'Siyah Pasaport (Diplomatik)'];
const schengenCountries = ['Almanya', 'Avusturya', 'Belçika', 'Çekya', 'Danimarka', 'Estonya', 'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İspanya', 'İsveç', 'İsviçre', 'İtalya', 'İzlanda', 'Letonya', 'Liechtenstein', 'Litvanya', 'Lüksemburg', 'Macaristan', 'Malta', 'Norveç', 'Polonya', 'Portekiz', 'Slovakya', 'Slovenya', 'Yunanistan'];
const visaStatuses = ['Evrak Topluyor', 'Evrak Tamamlandı', 'Evraklar Gönderildi', 'E-posta Gönderildi', 'Randevu Bekliyor', 'Başvuru Yapıldı', 'Sonuç Bekliyor', 'Müşteri İptal Etti'];
const tourStatuses = ['Planlama', 'Açık', 'Dolu', 'Devam Ediyor', 'Tamamlandı', 'İptal'];
const mealPlans = ['Sadece Oda', 'Oda + Kahvaltı', 'Yarım Pansiyon', 'Tam Pansiyon', 'Her Şey Dahil'];
const currencies = ['€ Euro', '$ Dolar', '₺ TL', '£ Sterlin'];

const labelStyle = { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#e8f1f8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '10px 12px', background: '#0f2744', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#e8f1f8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const dateSelectStyle = { padding: '10px 6px', background: '#0f2744', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#e8f1f8', fontSize: '13px', outline: 'none' };

const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const formatDate = (d) => { if (!d) return '-'; if (typeof d !== 'string') d = String(d); if (d.includes('-')) return d.split('-').reverse().join('.'); if (d.includes('.')) return d; return d; };
const safeParseTags = (val) => { if (!val) return []; if (Array.isArray(val)) return val.filter(t => t && typeof t === 'string'); if (typeof val === 'string') return val.split(',').map(t => t.trim()).filter(Boolean); return []; };
const safeParseActivities = (val) => { if (!val) return []; if (Array.isArray(val)) return val; if (typeof val === 'string') { try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; } } return []; };
const safeParseJSON = (val) => { if (!val) return []; if (Array.isArray(val)) return val; if (typeof val === 'string') { try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; } } return []; };
const safeParseDate = (dateStr) => { if (!dateStr || typeof dateStr !== 'string') return null; const parts = dateStr.split('-'); if (parts.length !== 3) return null; const [year, month, day] = parts.map(Number); if (isNaN(year) || isNaN(month) || isNaN(day)) return null; const date = new Date(year, month - 1, day, 12, 0, 0); if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null; return date; };
const safeParseNumber = (val) => { if (!val) return 0; const cleaned = String(val).replace(/[€$£₺\s]/g, '').replace(',', '.'); const num = parseFloat(cleaned); return isNaN(num) ? 0 : num; };
const getDaysLeft = (dateStr) => { const date = safeParseDate(dateStr); if (!date) return null; const today = new Date(); today.setHours(0, 0, 0, 0); date.setHours(0, 0, 0, 0); return Math.ceil((date - today) / (1000 * 60 * 60 * 24)); };
const generateUniqueId = () => Date.now() + Math.random();

// Telefon formatla: +90 5XX XXX XX XX
const formatPhoneNumber = (value) => {
  let cleaned = value.replace(/\D/g, '');
  // 90 ile başlıyorsa kaldır
  if (cleaned.startsWith('90')) cleaned = cleaned.slice(2);
  // 0 ile başlıyorsa kaldır
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  // Max 10 hane
  cleaned = cleaned.slice(0, 10);
  // Format: XXX XXX XX XX
  let formatted = '';
  if (cleaned.length > 0) formatted += cleaned.slice(0, 3);
  if (cleaned.length > 3) formatted += ' ' + cleaned.slice(3, 6);
  if (cleaned.length > 6) formatted += ' ' + cleaned.slice(6, 8);
  if (cleaned.length > 8) formatted += ' ' + cleaned.slice(8, 10);
  return formatted ? '+90 ' + formatted : '+90 5';
};

// Pasaport No formatla: İlk harf büyük, 9 karakter
const formatPassportNo = (value) => {
  // Boşluk ve özel karakterleri temizle
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.length === 0) return '';
  
  // İlk karakter HARF olmalı
  let firstChar = cleaned[0];
  if (!/[A-Z]/.test(firstChar)) {
    // İlk karakter harf değilse, ilk harfi bul veya boş dön
    const firstLetterMatch = cleaned.match(/[A-Z]/);
    if (!firstLetterMatch) return '';
    firstChar = firstLetterMatch[0];
    cleaned = cleaned.replace(firstChar, ''); // Harfi çıkar
  } else {
    cleaned = cleaned.slice(1); // İlk harfi ayır
  }
  
  // Geriye kalan sadece RAKAM olmalı (8 hane)
  const numbers = cleaned.replace(/[^0-9]/g, '').slice(0, 8);
  
  return firstChar + numbers;
};

// Toast Component
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(toast => (
        <div key={toast.id} onClick={() => removeToast(toast.id)} style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                      toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                      toast.type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                      'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '250px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.undo && (
            <button onClick={(e) => { e.stopPropagation(); toast.undo(); removeToast(toast.id); }} style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}>↩️ Geri Al</button>
          )}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// Loading Button Component
function LoadingButton({ onClick, loading, disabled, children, style, ...props }) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading || disabled}
      style={{
        ...style,
        opacity: (loading || disabled) ? 0.6 : 1,
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        position: 'relative'
      }}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid rgba(255,255,255,0.3)', 
            borderTop: '2px solid white', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          İşleniyor...
        </span>
      ) : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// Form Error Component
function FormError({ error }) {
  if (!error) return null;
  return (
    <p style={{ 
      margin: '4px 0 0', 
      fontSize: '11px', 
      color: '#ef4444',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      ⚠️ {error}
    </p>
  );
}

function CalendarPicker({ label, value, onChange, minYear = 1920, maxYear = 2035, maxDate = null, minDate = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parts = value.split('-');
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1 };
    }
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  });
  
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  
  const formatDisplay = (val) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };
  
  const handleSelect = (day) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };
  
  const prevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };
  
  const nextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };
  
  const isDateDisabled = (day) => {
    const date = new Date(viewDate.year, viewDate.month, day);
    if (maxDate && date > new Date(maxDate)) return true;
    if (minDate && date < new Date(minDate)) return true;
    return false;
  };
  
  const isToday = (day) => {
    const today = new Date();
    return viewDate.year === today.getFullYear() && viewDate.month === today.getMonth() && day === today.getDate();
  };
  
  const isSelected = (day) => {
    if (!value) return false;
    const parts = value.split('-');
    return parseInt(parts[0]) === viewDate.year && parseInt(parts[1]) - 1 === viewDate.month && parseInt(parts[2]) === day;
  };
  
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <div style={{ position: 'relative' }}>
      <label style={labelStyle}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: value ? '#e8f1f8' : '#64748b' }}>{formatDisplay(value) || 'Tarih seçin'}</span>
        <span style={{ fontSize: '14px' }}>📅</span>
      </div>
      
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#0f2744', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', zIndex: 401, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', minWidth: '280px' }}>
            {/* Header - Month/Year Select */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <button type="button" onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', width: '32px', height: '32px', color: '#e8f1f8', cursor: 'pointer', fontSize: '16px' }}>‹</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={viewDate.month} 
                  onChange={e => setViewDate({ ...viewDate, month: parseInt(e.target.value) })}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px 8px', color: '#e8f1f8', fontSize: '13px', cursor: 'pointer' }}
                >
                  {months.map((m, i) => <option key={i} value={i} style={{ background: '#0f2744' }}>{m}</option>)}
                </select>
                <select 
                  value={viewDate.year} 
                  onChange={e => setViewDate({ ...viewDate, year: parseInt(e.target.value) })}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px 8px', color: '#e8f1f8', fontSize: '13px', cursor: 'pointer' }}
                >
                  {years.map(y => <option key={y} value={y} style={{ background: '#0f2744' }}>{y}</option>)}
                </select>
              </div>
              <button type="button" onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', width: '32px', height: '32px', color: '#e8f1f8', cursor: 'pointer', fontSize: '16px' }}>›</button>
            </div>
            
            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
              {days.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', padding: '4px', fontWeight: '600' }}>{d}</div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {calendarDays.map((day, i) => (
                <div key={i}>
                  {day && (
                    <button
                      type="button"
                      onClick={() => !isDateDisabled(day) && handleSelect(day)}
                      disabled={isDateDisabled(day)}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        border: 'none',
                        borderRadius: '8px',
                        background: isSelected(day) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : isToday(day) ? 'rgba(59,130,246,0.3)' : 'transparent',
                        color: isSelected(day) ? '#0c1929' : isDateDisabled(day) ? '#4a5568' : '#e8f1f8',
                        cursor: isDateDisabled(day) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: isSelected(day) || isToday(day) ? '600' : '400',
                        transition: 'all 0.15s'
                      }}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                type="button"
                onClick={() => { const t = new Date(); handleSelect(t.getDate()); setViewDate({ year: t.getFullYear(), month: t.getMonth() }); }}
                style={{ flex: 1, padding: '8px', background: 'rgba(59,130,246,0.2)', border: 'none', borderRadius: '6px', color: '#3b82f6', fontSize: '11px', cursor: 'pointer' }}
              >
                Bugün
              </button>
              <button 
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '6px', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
              >
                Temizle
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BirthDateInput({ label, value, onChange }) {
  return <CalendarPicker label={label} value={value} onChange={onChange} minYear={1920} maxYear={new Date().getFullYear()} maxDate={new Date().toISOString().split('T')[0]} />;
}

function DateInput({ label, value, onChange }) {
  return <CalendarPicker label={label} value={value} onChange={onChange} minYear={2020} maxYear={2040} />;
}

function FormInput({ label, ...p }) { return (<div><label style={labelStyle}>{label}</label><input {...p} style={inputStyle} /></div>); }
function StatCard({ value, label, color }) { return (<div style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '10px', padding: '14px' }}><div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div><div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{label}</div></div>); }
function Modal({ children, onClose, title }) { return (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}><div style={{ background: 'linear-gradient(180deg, #0f2744 0%, #0c1929 100%)', borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}><div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: '15px', flex: 1 }}>{title}</h3><button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button></div><div style={{ padding: '14px 16px' }}>{children}</div></div></div>); }
function InfoBox({ label, value, highlight }) { return (<div style={{ background: highlight ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px', border: highlight ? '1px solid rgba(245,158,11,0.2)' : 'none' }}><p style={{ fontSize: '10px', color: highlight ? '#f59e0b' : '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>{label}</p><p style={{ fontSize: '12px', margin: 0, color: value ? (highlight ? '#f59e0b' : '#e8f1f8') : '#64748b' }}>{value || '-'}</p></div>); }

function LoginScreen({ onLogin, users }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('E-posta adresi gerekli'); return; }
    if (!password) { setError('Şifre gerekli'); return; }
    setLoading(true);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) { onLogin(user); } else { setError('E-posta veya şifre hatalı'); }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0d2137 100%)', fontFamily: "'Segoe UI', sans-serif", padding: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✈️</div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#e8f1f8', fontWeight: '700' }}>Paydos Turizm</h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>Giriş yapın</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}><label style={labelStyle}>E-posta Adresi</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@paydos.com" style={{ ...inputStyle, padding: '12px 14px', fontSize: '15px' }} /></div>
          <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Şifre</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" style={{ ...inputStyle, padding: '12px 14px', fontSize: '15px' }} /></div>
          {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#0c1929', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Giriş yapılıyor...' : '🔓 Giriş Yap'}</button>
        </form>
      </div>
    </div>
  );
}

function DashboardModule({ customers, isMobile }) {
  // Schengen vizesi olanlar
  const withSchengen = customers.filter(c => {
    const visas = safeParseJSON(c.schengenVisas);
    return visas.some(v => v.country && v.endDate);
  });
  // USA vizesi olanlar
  const withUsa = customers.filter(c => {
    const visa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
    return visa.endDate;
  });
  // Pasaportu 6 ay içinde bitecekler
  const expiringPassports = customers.filter(c => {
    const pList = safeParseJSON(c.passports);
    return pList.some(p => {
      const days = getDaysLeft(p.expiryDate);
      return days !== null && days > 0 && days <= 180;
    });
  });
  // Yeşil Pasaportlu Olanlar
  const withGreenPassport = customers.filter(c => {
    const pList = safeParseJSON(c.passports);
    return pList.some(p => p.passportType === 'Yeşil Pasaport (Hususi)');
  });

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>📊 Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard value={customers.length} label="Toplam Müşteri" color="#3b82f6" />
        <StatCard value={withSchengen.length} label="Schengen Vizeli" color="#10b981" />
        <StatCard value={withUsa.length} label="ABD Vizeli" color="#8b5cf6" />
        <StatCard value={expiringPassports.length} label="Pasaport Uyarı" color="#ef4444" />
        <StatCard value={withGreenPassport.length} label="Yeşil Pasaport" color="#059669" />
      </div>
    </div>
  );
}

function CustomerModule({ customers, setCustomers, isMobile, appSettings }) {
  const [activeTab, setActiveTab] = useState('search');
  const [showForm, setShowForm] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({});
  const [detailTab, setDetailTab] = useState('info');
  const [imagePreview, setImagePreview] = useState({ show: false, src: '', title: '' });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  // Arama filtreleri
  const [filters, setFilters] = useState({
    firstName: '', lastName: '', tcKimlik: '', phone: '', email: '',
    birthDate: '', birthPlace: '', city: '', tkMemberNo: '', sector: '', companyName: ''
  });

  // Pasaport state
  const [passports, setPassports] = useState([]);
  const emptyPassport = { id: '', nationality: 'Türkiye', passportType: 'Bordo Pasaport (Umuma Mahsus)', passportNo: '', issueDate: '', expiryDate: '', image: '' };

  // Schengen state (5 adet)
  const [schengenVisas, setSchengenVisas] = useState([
    { id: 1, country: '', startDate: '', endDate: '', image: '' }
  ]);

  // USA state
  const [usaVisa, setUsaVisa] = useState({ startDate: '', endDate: '', image: '' });
  const [formTab, setFormTab] = useState('info');

  const emptyForm = { 
    firstName: '', lastName: '', tcKimlik: '', phone: '', email: '', 
    birthDate: '', birthPlace: '', city: '', tkMemberNo: '', 
    sector: '', companyName: '', notes: '', tags: [], activities: [],
    passports: [], schengenVisas: [], usaVisa: {}
  };

  // === YENİ HESAPLAMALAR ===
  
  // Pasaportu 6 ay içinde bitecek müşteriler
  const expiringPassports = customers.filter(c => {
    const pList = safeParseJSON(c.passports);
    return pList.some(p => {
      const days = getDaysLeft(p.expiryDate);
      return days !== null && days > 0 && days <= 180;
    });
  });

  // Bugün doğum günü olanlar
  const todayBirthdays = customers.filter(c => {
    if (!c.birthDate) return false;
    const today = new Date();
    const birth = safeParseDate(c.birthDate);
    if (!birth) return false;
    return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
  });

  // Schengen vizesi olanlar
  const withSchengen = customers.filter(c => {
    const visas = safeParseJSON(c.schengenVisas);
    return visas.some(v => v.country && v.endDate);
  });

  // Schengen vizesi 3 ay içinde bitecekler
  const schengenExpiring = customers.filter(c => {
    const visas = safeParseJSON(c.schengenVisas);
    return visas.some(v => {
      if (!v.endDate) return false;
      const days = getDaysLeft(v.endDate);
      return days !== null && days > 0 && days <= 90;
    });
  });

  // USA vizesi olanlar
  const withUsa = customers.filter(c => {
    const visa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
    return visa.endDate;
  });

  // USA vizesi 1 ay içinde bitecekler
  const usaExpiring = customers.filter(c => {
    const visa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
    if (!visa.endDate) return false;
    const days = getDaysLeft(visa.endDate);
    return days !== null && days > 0 && days <= 30;
  });

  // Yeşil Pasaportlu Olanlar
  const withGreenPassport = customers.filter(c => {
    const pList = safeParseJSON(c.passports);
    return pList.some(p => p.passportType === 'Yeşil Pasaport (Hususi)');
  });

  // Filtreleme fonksiyonu
  const hasActiveFilter = Object.values(filters).some(v => v && v.trim() !== '');
  
  const filtered = customers.filter(c => {
    if (!hasActiveFilter) return false;
    
    const matchField = (field, value) => {
      if (!value || value.trim() === '') return true;
      const fieldVal = c[field] || '';
      return fieldVal.toLowerCase().includes(value.toLowerCase());
    };

    return matchField('firstName', filters.firstName) &&
           matchField('lastName', filters.lastName) &&
           matchField('tcKimlik', filters.tcKimlik) &&
           matchField('phone', filters.phone) &&
           matchField('email', filters.email) &&
           matchField('birthDate', filters.birthDate) &&
           matchField('birthPlace', filters.birthPlace) &&
           matchField('city', filters.city) &&
           matchField('tkMemberNo', filters.tkMemberNo) &&
           matchField('sector', filters.sector) &&
           matchField('companyName', filters.companyName);
  });

  const clearFilters = () => {
    setFilters({ firstName: '', lastName: '', tcKimlik: '', phone: '', email: '', birthDate: '', birthPlace: '', city: '', tkMemberNo: '', sector: '', companyName: '' });
    setShowResults(false);
  };

  const handleSearch = () => {
    if (hasActiveFilter) setShowResults(true);
  };

  // Excel Export
  const exportToExcel = (data, filename) => {
    const exportData = data.map(c => ({
      'Ad': c.firstName || '',
      'Soyad': c.lastName || '',
      'TC Kimlik': c.tcKimlik || '',
      'Telefon': c.phone || '',
      'E-posta': c.email || '',
      'Doğum Tarihi': formatDate(c.birthDate),
      'Doğum Yeri': c.birthPlace || '',
      'İkametgah İli': c.city || '',
      'TK Üyelik No': c.tkMemberNo || '',
      'Sektör': c.sector || '',
      'Firma': c.companyName || '',
      'Notlar': c.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Excel Import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newCustomers = data.map(row => ({
          id: generateUniqueId(),
          firstName: row['Ad'] || row['ad'] || row['AD'] || '',
          lastName: row['Soyad'] || row['soyad'] || row['SOYAD'] || '',
          tcKimlik: String(row['TC Kimlik'] || row['TC'] || row['tc'] || ''),
          phone: String(row['Telefon'] || row['telefon'] || row['TEL'] || ''),
          email: row['E-posta'] || row['Email'] || row['email'] || '',
          birthDate: row['Doğum Tarihi'] || '',
          birthPlace: row['Doğum Yeri'] || '',
          city: row['İkametgah İli'] || row['İl'] || row['Şehir'] || '',
          tkMemberNo: row['TK Üyelik No'] || row['TK No'] || '',
          sector: row['Sektör'] || '',
          companyName: row['Firma'] || row['Şirket'] || '',
          notes: row['Notlar'] || row['Not'] || '',
          createdAt: new Date().toISOString().split('T')[0],
          tags: [],
          activities: [],
          passports: [],
          schengenVisas: [],
          usaVisa: {}
        })).filter(c => c.firstName || c.lastName);

        if (newCustomers.length === 0) {
          alert('Excel dosyasında geçerli müşteri bulunamadı!');
          return;
        }

        setCustomers([...customers, ...newCustomers]);
        
        for (const c of newCustomers) {
          try { await supabase.from('customers').insert([toSnakeCase(c)]); } catch (err) { console.error(err); }
        }
        
        alert(`${newCustomers.length} müşteri başarıyla eklendi!`);
        setShowExcelModal(false);
      } catch (err) {
        console.error(err);
        alert('Excel dosyası okunamadı!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const resetForm = () => { 
    setFormData(emptyForm); 
    setEditingCustomer(null); 
    setFormTab('info');
    setPassports([{ ...emptyPassport, id: generateUniqueId() }]);
    setSchengenVisas([{ id: 1, country: '', startDate: '', endDate: '', image: '' }]);
    setUsaVisa({ startDate: '', endDate: '', image: '' });
  };
  
  const openNewForm = () => { 
    resetForm(); 
    setShowForm(true); 
  };
  
  const openEditForm = (customer) => { 
    setEditingCustomer(customer); 
    setFormData({ ...emptyForm, ...customer, tags: safeParseTags(customer.tags), activities: safeParseActivities(customer.activities) }); 
    // Pasaport bilgilerini yükle
    const savedPassports = safeParseJSON(customer.passports);
    setPassports(savedPassports.length > 0 ? savedPassports : [{ ...emptyPassport, id: generateUniqueId() }]);
    // Schengen bilgilerini yükle
    const savedSchengen = safeParseJSON(customer.schengenVisas).filter(v => v.country);
    setSchengenVisas(savedSchengen.length > 0 ? savedSchengen : [{ id: 1, country: '', startDate: '', endDate: '', image: '' }]);
    // USA bilgilerini yükle
    const savedUsa = customer.usaVisa ? (typeof customer.usaVisa === 'string' ? JSON.parse(customer.usaVisa) : customer.usaVisa) : {};
    setUsaVisa({ startDate: savedUsa.startDate || '', endDate: savedUsa.endDate || '', image: savedUsa.image || '' });
    setFormTab('info');
    setShowForm(true); 
  };

  const openPassportModal = (customer) => {
    setSelectedCustomer(customer);
    const savedPassports = safeParseJSON(customer.passports);
    setPassports(savedPassports.length > 0 ? savedPassports : [{ ...emptyPassport, id: generateUniqueId() }]);
    setShowPassportModal(true);
  };

  const openSchengenModal = (customer) => {
    setSelectedCustomer(customer);
    const saved = safeParseJSON(customer.schengenVisas).filter(v => v.country);
    setSchengenVisas(saved.length > 0 ? saved : [{ id: 1, country: '', startDate: '', endDate: '', image: '' }]);
    setShowSchengenModal(true);
  };

  const openUsaModal = (customer) => {
    setSelectedCustomer(customer);
    const saved = customer.usaVisa ? (typeof customer.usaVisa === 'string' ? JSON.parse(customer.usaVisa) : customer.usaVisa) : {};
    setUsaVisa({ startDate: saved.startDate || '', endDate: saved.endDate || '', image: saved.image || '' });
    setShowUsaModal(true);
  };

  const addPassport = () => {
    setPassports([...passports, { ...emptyPassport, id: generateUniqueId() }]);
  };

  const removePassport = (id) => {
    if (passports.length <= 1) return;
    setPassports(passports.filter(p => p.id !== id));
  };

  const updatePassport = (id, field, value) => {
    setPassports(passports.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageUpload = (callback) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('Dosya boyutu 2MB\'dan küçük olmalı'); return; }
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert('Ad, Soyad ve Telefon alanları zorunludur!');
      setFormTab('info');
      return;
    }
    
    const now = new Date().toISOString();
    const fullData = {
      ...formData,
      passports: passports,
      schengenVisas: schengenVisas,
      usaVisa: usaVisa
    };
    
    if (editingCustomer) {
      const updated = customers.map(c => c.id === editingCustomer.id ? { ...c, ...fullData } : c);
      setCustomers(updated);
      try { 
        await supabase.from('customers').update({
          ...toSnakeCase(formData),
          passports: JSON.stringify(passports),
          schengen_visas: JSON.stringify(schengenVisas),
          usa_visa: JSON.stringify(usaVisa)
        }).eq('id', editingCustomer.id); 
      } catch (err) { console.error(err); }
    } else {
      const newCustomer = { ...fullData, id: generateUniqueId(), createdAt: now.split('T')[0] };
      setCustomers([...customers, newCustomer]);
      try { 
        await supabase.from('customers').insert([{
          ...toSnakeCase({ ...formData, id: newCustomer.id, createdAt: newCustomer.createdAt }),
          passports: JSON.stringify(passports),
          schengen_visas: JSON.stringify(schengenVisas),
          usa_visa: JSON.stringify(usaVisa)
        }]); 
      } catch (err) { console.error(err); }
    }
    setShowForm(false);
    resetForm();
  };

  const handlePassportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const dataToSave = { passports: JSON.stringify(passports) };
    const updatedCustomer = { ...selectedCustomer, passports };
    const updated = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    setSelectedCustomer(updatedCustomer);
    try { await supabase.from('customers').update(dataToSave).eq('id', selectedCustomer.id); } catch (err) { console.error(err); }
    setShowPassportModal(false);
  };

  const handleSchengenSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const dataToSave = { schengen_visas: JSON.stringify(schengenVisas) };
    const updatedCustomer = { ...selectedCustomer, schengenVisas };
    const updated = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    setSelectedCustomer(updatedCustomer);
    try { await supabase.from('customers').update(dataToSave).eq('id', selectedCustomer.id); } catch (err) { console.error(err); }
    setShowSchengenModal(false);
  };

  const handleUsaSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const dataToSave = { usa_visa: JSON.stringify(usaVisa) };
    const updatedCustomer = { ...selectedCustomer, usaVisa };
    const updated = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    setSelectedCustomer(updatedCustomer);
    try { await supabase.from('customers').update(dataToSave).eq('id', selectedCustomer.id); } catch (err) { console.error(err); }
    setShowUsaModal(false);
  };

  const deleteCustomer = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    setCustomers(customers.filter(c => c.id !== id));
    try { await supabase.from('customers').delete().eq('id', id); } catch (err) { console.error(err); }
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
  };

  const mainTabStyle = (active) => ({
    flex: 1, padding: '10px 8px', background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: active ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontSize: '11px', fontWeight: active ? '600' : '400',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
  });

  const tabStyle = (active) => ({
    flex: 1, padding: '8px', background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: active ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontSize: '11px', fontWeight: active ? '600' : '400'
  });

  const ImageUploadBox = ({ label, value, onUpload, onClear, small }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: small ? '8px' : '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value} alt={label} style={{ width: '100%', height: small ? '50px' : '70px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setImagePreview({ show: true, src: value, title: label })} />
          <button type="button" onClick={onClear} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: 'white', cursor: 'pointer', fontSize: '10px' }}>✕</button>
        </div>
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: small ? '50px' : '60px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#64748b', fontSize: '10px' }}>
          📷 {label}
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
        </label>
      )}
    </div>
  );

  // TAM SAYFA FORM - Müşteri Ekleme/Düzenleme
  const renderFullPageForm = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #0a1628 0%, #132742 50%, #0a1628 100%)', zIndex: 300, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, background: 'linear-gradient(180deg, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.95) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => { setShowForm(false); resetForm(); }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', color: '#e8f1f8', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
            <span>←</span> Geri
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{editingCustomer ? 'Bilgileri güncelleyin' : 'Müşteri bilgilerini girin'}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '16px' }}>
          {[
            { id: 'info', icon: '👤', label: 'Kişisel', color: '#f59e0b' },
            { id: 'passport', icon: '🛂', label: 'Pasaport', color: '#3b82f6' },
            { id: 'schengen', icon: '🇪🇺', label: 'Schengen', color: '#10b981' },
            { id: 'usa', icon: '🇺🇸', label: 'ABD', color: '#8b5cf6' }
          ].map((tab, idx) => (
            <button 
              key={tab.id}
              onClick={() => setFormTab(tab.id)} 
              style={{ 
                flex: 1, 
                padding: '14px 8px', 
                background: formTab === tab.id ? `linear-gradient(135deg, ${tab.color}20, ${tab.color}10)` : 'transparent',
                border: formTab === tab.id ? `1px solid ${tab.color}40` : '1px solid transparent',
                borderRadius: '12px', 
                color: formTab === tab.id ? tab.color : '#64748b', 
                cursor: 'pointer', 
                fontSize: '12px', 
                fontWeight: formTab === tab.id ? '600' : '500',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '20px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {formTab === tab.id && <div style={{ width: '20px', height: '3px', background: tab.color, borderRadius: '2px', marginTop: '2px' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div style={{ padding: '20px', paddingBottom: '120px' }}>
        {/* KİŞİSEL BİLGİLER */}
        {formTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Temel Bilgiler Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>Temel Bilgiler</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Ad, soyad ve iletişim bilgileri</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormInput label="Ad *" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Adı girin" />
                  <FormInput label="Soyad *" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Soyadı girin" />
                </div>
                <FormInput label="TC Kimlik No" value={formData.tcKimlik || ''} onChange={e => setFormData({...formData, tcKimlik: e.target.value})} maxLength="11" placeholder="11 haneli TC kimlik numarası" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Telefon *</label>
                    <input 
                      type="tel" 
                      value={formData.phone || '+90 5'} 
                      onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} 
                      placeholder="+90 5XX XXX XX XX"
                      style={inputStyle}
                    />
                  </div>
                  <FormInput label="E-posta" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ornek@email.com" />
                </div>
              </div>
            </div>

            {/* Kişisel Detaylar Card - Dinamik */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📍</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>Kişisel Detaylar</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Doğum ve ikamet bilgileri</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Dinamik alanları göster */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {(appSettings?.personalDetailsFields || ['Doğum Tarihi', 'Doğum Yeri', 'İkametgah İli', 'TK Üyelik No']).map((field, idx) => {
                    if (field === 'Doğum Tarihi') {
                      return <BirthDateInput key={idx} label="Doğum Tarihi" value={formData.birthDate || ''} onChange={v => setFormData({...formData, birthDate: v})} />;
                    } else if (field === 'İkametgah İli') {
                      return (
                        <div key={idx}>
                          <label style={labelStyle}>İkametgah İli</label>
                          <select value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} style={selectStyle}>
                            <option value="">İl seçin</option>
                            {turkishProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      );
                    } else {
                      // Diğer alanlar için generic input - field ismini key olarak kullan
                      const fieldKey = field.toLowerCase().replace(/\s+/g, '_').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
                      return <FormInput key={idx} label={field} value={formData[fieldKey] || ''} onChange={e => setFormData({...formData, [fieldKey]: e.target.value})} placeholder={field} />;
                    }
                  })}
                </div>
              </div>
            </div>

            {/* İş Bilgileri Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💼</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>İş Bilgileri</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Meslek ve firma bilgileri</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Sektör</label>
                    <select value={formData.sector || ''} onChange={e => setFormData({...formData, sector: e.target.value})} style={selectStyle}>
                      <option value="">Sektör seçin</option>
                      {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <FormInput label="Firma" value={formData.companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Firma adı" />
                </div>
                <div>
                  <label style={labelStyle}>Notlar</label>
                  <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Müşteri hakkında notlar..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASAPORT BİLGİLERİ */}
        {formTab === 'passport' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Müşterinin birden fazla pasaportu varsa hepsini ekleyebilirsiniz.</p>
            </div>
            
            {passports.map((passport, idx) => (
              <div key={passport.id} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.03) 100%)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '700' }}>{idx + 1}</div>
                    <h4 style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>Pasaport #{idx + 1}</h4>
                  </div>
                  {passports.length > 1 && (
                    <button type="button" onClick={() => removePassport(passport.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '6px 10px', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                  )}
                </div>
                {/* Yatay düzen: Sol form, sağ görsel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px', alignItems: 'start' }}>
                  {/* Sol: Form alanları */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <FormInput label="Uyruk" value={passport.nationality || 'Türkiye'} onChange={e => updatePassport(passport.id, 'nationality', e.target.value)} />
                      <div>
                        <label style={labelStyle}>Pasaport Türü</label>
                        <select value={passport.passportType || ''} onChange={e => updatePassport(passport.id, 'passportType', e.target.value)} style={{ ...selectStyle, padding: '8px 10px', fontSize: '13px' }}>
                          {passportTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Pasaport No (9 hane, ilk karakter harf)</label>
                      <input 
                        type="text" 
                        value={passport.passportNo || ''} 
                        onChange={e => updatePassport(passport.id, 'passportNo', formatPassportNo(e.target.value))}
                        placeholder="U12345678"
                        maxLength="9"
                        style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <DateInput label="Veriliş" value={passport.issueDate || ''} onChange={v => updatePassport(passport.id, 'issueDate', v)} />
                      <DateInput label="Geçerlilik" value={passport.expiryDate || ''} onChange={v => updatePassport(passport.id, 'expiryDate', v)} />
                    </div>
                  </div>
                  {/* Sağ: Görsel - Tıkla Büyüt */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pasaport Görseli</label>
                    {passport.image ? (
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={passport.image} 
                          alt="Pasaport" 
                          onClick={() => setImagePreview({ show: true, src: passport.image, title: `Pasaport #${idx + 1} - ${passport.passportNo || 'Görsel'}` })}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(59,130,246,0.3)', cursor: 'zoom-in' }} 
                        />
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', color: 'white' }}>🔍 Büyütmek için tıkla</div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); updatePassport(passport.id, 'image', ''); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>×</button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', background: 'rgba(59,130,246,0.1)', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '10px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '32px', marginBottom: '6px' }}>📷</span>
                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '500' }}>Pasaport Yükle</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload((img) => updatePassport(passport.id, 'image', img))} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addPassport} style={{ width: '100%', padding: '14px', background: 'transparent', border: '2px dashed rgba(59,130,246,0.4)', borderRadius: '12px', color: '#3b82f6', fontSize: '13px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>+</span> Pasaport Ekle
            </button>
          </div>
        )}

        {/* SCHENGEN VİZESİ */}
        {formTab === 'schengen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🇪🇺</span>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Mevcut veya geçmiş Schengen vizelerini ekleyebilirsiniz.</p>
            </div>
            
            {schengenVisas.map((visa, idx) => (
              <div key={visa.id} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.03) 100%)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '700' }}>{idx + 1}</div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>Schengen Vizesi #{idx + 1}</span>
                  </div>
                  {schengenVisas.length > 1 && (
                    <button type="button" onClick={() => setSchengenVisas(schengenVisas.filter(v => v.id !== visa.id))} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '6px 10px', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                  )}
                </div>
                {/* Yatay düzen: Sol form, sağ görsel - BÜYÜK */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '16px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Verildiği Ülke</label>
                      <select value={visa.country || ''} onChange={e => setSchengenVisas(schengenVisas.map(v => v.id === visa.id ? {...v, country: e.target.value} : v))} style={selectStyle}>
                        <option value="">Ülke seçin</option>
                        {schengenCountries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <DateInput label="Başlangıç" value={visa.startDate || ''} onChange={v => setSchengenVisas(schengenVisas.map(vs => vs.id === visa.id ? {...vs, startDate: v} : vs))} />
                      <DateInput label="Bitiş" value={visa.endDate || ''} onChange={v => setSchengenVisas(schengenVisas.map(vs => vs.id === visa.id ? {...vs, endDate: v} : vs))} />
                    </div>
                  </div>
                  {/* Sağ: Görsel - Tıkla Büyüt */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Vize Görseli</label>
                    {visa.image ? (
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={visa.image} 
                          alt="Vize" 
                          onClick={() => setImagePreview({ show: true, src: visa.image, title: `Schengen Vizesi #${idx + 1} - ${visa.country || 'Görsel'}` })}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(16,185,129,0.3)', cursor: 'zoom-in' }} 
                        />
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', color: 'white' }}>🔍 Büyüt</div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSchengenVisas(schengenVisas.map(v => v.id === visa.id ? {...v, image: ''} : v)); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>×</button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', background: 'rgba(16,185,129,0.1)', border: '2px dashed rgba(16,185,129,0.3)', borderRadius: '10px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '28px', marginBottom: '6px' }}>📷</span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>Vize Yükle</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload((img) => setSchengenVisas(schengenVisas.map(v => v.id === visa.id ? {...v, image: img} : v)))} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Vize Ekle Butonu - Sınırsız */}
            <button type="button" onClick={() => setSchengenVisas([...schengenVisas, { id: Date.now(), country: '', startDate: '', endDate: '', image: '' }])} style={{ width: '100%', padding: '14px', background: 'transparent', border: '2px dashed rgba(16,185,129,0.4)', borderRadius: '12px', color: '#10b981', fontSize: '13px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>+</span> Schengen Vizesi Ekle
            </button>
          </div>
        )}

        {/* ABD VİZESİ */}
        {formTab === 'usa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🇺🇸</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Amerika Vizesi</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>ABD vize bilgilerini girin</p>
                </div>
              </div>
              {/* Yatay düzen: Sol form, sağ görsel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <DateInput label="Vize Başlangıç" value={usaVisa.startDate || ''} onChange={v => setUsaVisa({...usaVisa, startDate: v})} />
                    <DateInput label="Vize Bitiş" value={usaVisa.endDate || ''} onChange={v => setUsaVisa({...usaVisa, endDate: v})} />
                  </div>
                </div>
                {/* Sağ: Görsel - Tıkla Büyüt */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Vize Görseli</label>
                  {usaVisa.image ? (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={usaVisa.image} 
                        alt="ABD Vizesi" 
                        onClick={() => setImagePreview({ show: true, src: usaVisa.image, title: 'ABD Vizesi' })}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(139,92,246,0.3)', cursor: 'zoom-in' }} 
                      />
                      <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', color: 'white' }}>🔍 Büyüt</div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setUsaVisa({...usaVisa, image: ''}); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>×</button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', background: 'rgba(139,92,246,0.1)', border: '2px dashed rgba(139,92,246,0.3)', borderRadius: '10px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '28px', marginBottom: '6px' }}>📷</span>
                      <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '500' }}>Vize Yükle</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload((img) => setUsaVisa({...usaVisa, image: img}))} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(10,22,40,0.95) 20%, rgba(10,22,40,1) 100%)', padding: '20px', paddingTop: '40px' }}>
        <button onClick={handleSubmit} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '14px', color: '#0c1929', fontWeight: '700', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
          <span>💾</span> {editingCustomer ? 'Değişiklikleri Kaydet' : 'Müşteriyi Kaydet'}
        </button>
      </div>
    </div>
  );

  // TAM SAYFA DETAY - Müşteri Görüntüleme
  const renderFullPageDetail = () => {
    if (!selectedCustomer) return null;
    const c = selectedCustomer;
    const cPassports = safeParseJSON(c.passports);
    const cSchengen = safeParseJSON(c.schengenVisas).filter(v => v.country);
    const cUsa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
    const hasGreenPassport = cPassports.some(p => p.passportType === 'Yeşil Pasaport (Hususi)');

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #0a1628 0%, #132742 50%, #0a1628 100%)', zIndex: 300, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'linear-gradient(180deg, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.95) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => { setSelectedCustomer(null); setDetailTab('info'); }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', color: '#e8f1f8', cursor: 'pointer', fontSize: '14px' }}>← Geri</button>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>{c.firstName} {c.lastName}</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{c.phone}</p>
            </div>
          </div>
          <button onClick={() => { setSelectedCustomer(null); openEditForm(c); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>✏️ Düzenle</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '16px' }}>
            {[
              { id: 'info', icon: '📋', label: 'Bilgiler', color: '#f59e0b' },
              { id: 'passport', icon: '🛂', label: 'Pasaport', color: '#3b82f6', count: cPassports.length },
              { id: 'schengen', icon: '🇪🇺', label: hasGreenPassport ? 'Muaf ✓' : 'Schengen', color: '#10b981', count: hasGreenPassport ? null : cSchengen.length },
              { id: 'usa', icon: '🇺🇸', label: 'ABD', color: '#8b5cf6', count: cUsa.endDate ? 1 : 0 }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setDetailTab(tab.id)} 
                style={{ 
                  flex: 1, 
                  padding: '12px 8px', 
                  background: detailTab === tab.id ? `linear-gradient(135deg, ${tab.color}20, ${tab.color}10)` : 'transparent',
                  border: detailTab === tab.id ? `1px solid ${tab.color}40` : '1px solid transparent',
                  borderRadius: '12px', 
                  color: detailTab === tab.id ? tab.color : '#64748b', 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  fontWeight: detailTab === tab.id ? '600' : '500',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.label} {tab.count !== undefined && `(${tab.count})`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          {/* KİŞİSEL BİLGİLER */}
          {detailTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* İletişim */}
              <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📞</div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>İletişim Bilgileri</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <a href={`https://wa.me/90${c.phone?.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37,211,102,0.15)', padding: '12px', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(37,211,102,0.3)' }}>
                      <span style={{ fontSize: '20px' }}>📱</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>WhatsApp</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#25d366', fontWeight: '600' }}>{c.phone || '-'}</p>
                      </div>
                    </a>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ background: 'rgba(59,130,246,0.15)', padding: '12px', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <span style={{ fontSize: '20px' }}>✉️</span>
                        <div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>E-posta</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>{c.email}</p>
                        </div>
                      </a>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>✉️</span>
                        <div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>E-posta</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>-</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kimlik Bilgileri */}
              <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🪪</div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>Kimlik Bilgileri</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <InfoBox label="TC Kimlik No" value={c.tcKimlik} />
                  <InfoBox label="TK Üyelik No" value={c.tkMemberNo} />
                  <InfoBox label="Doğum Tarihi" value={formatDate(c.birthDate)} />
                  <InfoBox label="Doğum Yeri" value={c.birthPlace} />
                  <InfoBox label="İkametgah İli" value={c.city} />
                </div>
              </div>

              {/* İş Bilgileri */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💼</div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>İş Bilgileri</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <InfoBox label="Sektör" value={c.sector} />
                  <InfoBox label="Firma" value={c.companyName} />
                </div>
                {c.notes && (
                  <div style={{ marginTop: '10px' }}>
                    <InfoBox label="Notlar" value={c.notes} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASAPORT */}
          {detailTab === 'passport' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cPassports.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                  <span style={{ fontSize: '48px' }}>🛂</span>
                  <p style={{ color: '#64748b', marginTop: '12px' }}>Pasaport bilgisi eklenmemiş</p>
                  <button onClick={() => openEditForm(c)} style={{ marginTop: '12px', padding: '10px 20px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }}>➕ Pasaport Ekle</button>
                </div>
              ) : (
                cPassports.map((p, idx) => (
                  <div key={p.id || idx} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.03) 100%)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: p.passportType?.includes('Yeşil') ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: '700' }}>{idx + 1}</div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: p.passportType?.includes('Yeşil') ? '#10b981' : '#3b82f6', fontWeight: '600' }}>{p.passportType || 'Pasaport'}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{p.nationality || 'Türkiye'}</p>
                        </div>
                      </div>
                      {p.expiryDate && getDaysLeft(p.expiryDate) <= 180 && getDaysLeft(p.expiryDate) > 0 && (
                        <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: '600' }}>⚠️ {getDaysLeft(p.expiryDate)} gün</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <InfoBox label="Pasaport No" value={p.passportNo} />
                      <InfoBox label="Veriliş Tarihi" value={formatDate(p.issueDate)} />
                      <InfoBox label="Geçerlilik Tarihi" value={formatDate(p.expiryDate)} highlight={p.expiryDate && getDaysLeft(p.expiryDate) <= 180} />
                    </div>
                    {p.image && (
                      <div style={{ marginTop: '12px' }}>
                        <img src={p.image} alt="Pasaport" onClick={() => setImagePreview({ show: true, src: p.image, title: `Pasaport - ${p.passportNo}` })} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer' }} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* SCHENGEN */}
          {detailTab === 'schengen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {hasGreenPassport ? (
                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>✓</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#10b981', fontWeight: '600' }}>Schengen Vizesi Muafiyeti</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#94a3b8' }}>Bu müşteri <strong style={{ color: '#10b981' }}>Yeşil Pasaport</strong> sahibi olduğu için Schengen ülkelerine vizesiz seyahat edebilir.</p>
                  <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '10px', padding: '12px', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>📋 90 gün içinde toplam 90 gün kalış hakkı</p>
                  </div>
                </div>
              ) : cSchengen.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                  <span style={{ fontSize: '48px' }}>🇪🇺</span>
                  <p style={{ color: '#64748b', marginTop: '12px' }}>Schengen vizesi eklenmemiş</p>
                  <button onClick={() => openEditForm(c)} style={{ marginTop: '12px', padding: '10px 20px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', cursor: 'pointer', fontSize: '13px' }}>➕ Vize Ekle</button>
                </div>
              ) : (
                cSchengen.map((v, idx) => (
                  <div key={v.id || idx} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.03) 100%)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🇪🇺</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: '600' }}>{v.country}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Schengen Vizesi</p>
                        </div>
                      </div>
                      {v.endDate && getDaysLeft(v.endDate) > 0 && getDaysLeft(v.endDate) <= 90 && (
                        <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(234,179,8,0.2)', color: '#eab308', fontWeight: '600' }}>⏰ {getDaysLeft(v.endDate)} gün</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <InfoBox label="Başlangıç" value={formatDate(v.startDate)} />
                      <InfoBox label="Bitiş" value={formatDate(v.endDate)} highlight={v.endDate && getDaysLeft(v.endDate) <= 90} />
                    </div>
                    {v.image && (
                      <div style={{ marginTop: '12px' }}>
                        <img src={v.image} alt="Vize" onClick={() => setImagePreview({ show: true, src: v.image, title: `Schengen - ${v.country}` })} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer' }} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABD */}
          {detailTab === 'usa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!cUsa.endDate ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                  <span style={{ fontSize: '48px' }}>🇺🇸</span>
                  <p style={{ color: '#64748b', marginTop: '12px' }}>ABD vizesi eklenmemiş</p>
                  <button onClick={() => openEditForm(c)} style={{ marginTop: '12px', padding: '10px 20px', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', fontSize: '13px' }}>➕ Vize Ekle</button>
                </div>
              ) : (
                <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🇺🇸</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>Amerika Vizesi</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>ABD B1/B2 Turist Vizesi</p>
                      </div>
                    </div>
                    {cUsa.endDate && getDaysLeft(cUsa.endDate) > 0 && getDaysLeft(cUsa.endDate) <= 30 && (
                      <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: '600' }}>⚠️ {getDaysLeft(cUsa.endDate)} gün</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <InfoBox label="Vize Başlangıç" value={formatDate(cUsa.startDate)} />
                    <InfoBox label="Vize Bitiş" value={formatDate(cUsa.endDate)} highlight={cUsa.endDate && getDaysLeft(cUsa.endDate) <= 30} />
                  </div>
                  {cUsa.image && (
                    <div style={{ marginTop: '16px' }}>
                      <img src={cUsa.image} alt="ABD Vizesi" onClick={() => setImagePreview({ show: true, src: cUsa.image, title: 'ABD Vizesi' })} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(10,22,40,0.95) 20%, rgba(10,22,40,1) 100%)', padding: '20px', paddingTop: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={() => { setSelectedCustomer(null); openEditForm(c); }} style={{ padding: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>✏️</span> Düzenle
            </button>
            <button onClick={() => { if(confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) { deleteCustomer(c.id); setSelectedCustomer(null); } }} style={{ padding: '14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🗑️</span> Sil
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Müşteri Kartı Render
  const renderCustomerCard = (c) => {
    const cPassports = safeParseJSON(c.passports);
    const cSchengen = safeParseJSON(c.schengenVisas).filter(v => v.country);
    const cUsa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
    const expiringP = cPassports.find(p => { const d = getDaysLeft(p.expiryDate); return d !== null && d > 0 && d <= 180; });
    
    return (
      <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone} {c.city && `• ${c.city}`}</p>
            {c.sector && <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>{c.sector}</p>}
          </div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {cPassports.length > 0 && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>🛂 {cPassports.length}</span>}
            {cSchengen.length > 0 && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>🇪🇺 {cSchengen.length}</span>}
            {cUsa.endDate && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>🇺🇸</span>}
            {expiringP && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>⚠️ {getDaysLeft(expiringP.expiryDate)}g</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>👥 Müşteriler ({customers.length})</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowExcelModal(true)} style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#10b981', cursor: 'pointer', fontSize: '12px' }}>📊 Excel</button>
          <button onClick={openNewForm} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#0c1929', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>➕ Yeni</button>
        </div>
      </div>

      {/* Ana Sekmeler - Satır 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
        <button onClick={() => { setActiveTab('search'); setShowResults(false); }} style={mainTabStyle(activeTab === 'search')}>
          <span style={{ fontSize: '14px' }}>🔍</span>
          <span>Arama</span>
        </button>
        <button onClick={() => setActiveTab('expiring')} style={mainTabStyle(activeTab === 'expiring')}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span>Pasaport ({expiringPassports.length})</span>
        </button>
        <button onClick={() => setActiveTab('birthday')} style={mainTabStyle(activeTab === 'birthday')}>
          <span style={{ fontSize: '14px' }}>🎂</span>
          <span>Doğum Günü ({todayBirthdays.length})</span>
        </button>
        <button onClick={() => setActiveTab('schengen')} style={{ ...mainTabStyle(activeTab === 'schengen'), background: activeTab === 'schengen' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'schengen' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)', color: activeTab === 'schengen' ? '#10b981' : '#94a3b8' }}>
          <span style={{ fontSize: '14px' }}>🇪🇺</span>
          <span>Schengen ({withSchengen.length})</span>
        </button>
      </div>

      {/* Ana Sekmeler - Satır 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('schengenExpiring')} style={{ ...mainTabStyle(activeTab === 'schengenExpiring'), background: activeTab === 'schengenExpiring' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'schengenExpiring' ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(255,255,255,0.1)', color: activeTab === 'schengenExpiring' ? '#eab308' : '#94a3b8' }}>
          <span style={{ fontSize: '14px' }}>🇪🇺⏰</span>
          <span>Sch. 3ay ({schengenExpiring.length})</span>
        </button>
        <button onClick={() => setActiveTab('usa')} style={{ ...mainTabStyle(activeTab === 'usa'), background: activeTab === 'usa' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'usa' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.1)', color: activeTab === 'usa' ? '#8b5cf6' : '#94a3b8' }}>
          <span style={{ fontSize: '14px' }}>🇺🇸</span>
          <span>ABD ({withUsa.length})</span>
        </button>
        <button onClick={() => setActiveTab('usaExpiring')} style={{ ...mainTabStyle(activeTab === 'usaExpiring'), background: activeTab === 'usaExpiring' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'usaExpiring' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)', color: activeTab === 'usaExpiring' ? '#ef4444' : '#94a3b8' }}>
          <span style={{ fontSize: '14px' }}>🇺🇸⏰</span>
          <span>ABD 1ay ({usaExpiring.length})</span>
        </button>
        <button onClick={() => setActiveTab('greenPassport')} style={{ ...mainTabStyle(activeTab === 'greenPassport'), background: activeTab === 'greenPassport' ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'greenPassport' ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(255,255,255,0.1)', color: activeTab === 'greenPassport' ? '#059669' : '#94a3b8' }}>
          <span style={{ fontSize: '14px' }}>🟢</span>
          <span>Yeşil Pas. ({withGreenPassport.length})</span>
        </button>
      </div>

      {/* ARAMA SEKMESİ */}
      {activeTab === 'search' && (
        <>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '8px' }}>
              <FormInput label="Ad" value={filters.firstName} onChange={e => setFilters({...filters, firstName: e.target.value})} placeholder="Ad ara..." />
              <FormInput label="Soyad" value={filters.lastName} onChange={e => setFilters({...filters, lastName: e.target.value})} placeholder="Soyad ara..." />
              <FormInput label="TC Kimlik" value={filters.tcKimlik} onChange={e => setFilters({...filters, tcKimlik: e.target.value})} placeholder="TC ara..." />
              <FormInput label="Telefon" value={filters.phone} onChange={e => setFilters({...filters, phone: e.target.value})} placeholder="Telefon ara..." />
              <FormInput label="E-posta" value={filters.email} onChange={e => setFilters({...filters, email: e.target.value})} placeholder="E-posta ara..." />
              <FormInput label="Doğum Yeri" value={filters.birthPlace} onChange={e => setFilters({...filters, birthPlace: e.target.value})} placeholder="Doğum yeri ara..." />
              <div>
                <label style={labelStyle}>İkametgah İli</label>
                <select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} style={selectStyle}>
                  <option value="">Tümü</option>
                  {turkishProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <FormInput label="TK Üyelik No" value={filters.tkMemberNo} onChange={e => setFilters({...filters, tkMemberNo: e.target.value})} placeholder="TK No ara..." />
              <div>
                <label style={labelStyle}>Sektör</label>
                <select value={filters.sector} onChange={e => setFilters({...filters, sector: e.target.value})} style={selectStyle}>
                  <option value="">Tümü</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <FormInput label="Firma" value={filters.companyName} onChange={e => setFilters({...filters, companyName: e.target.value})} placeholder="Firma ara..." />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={handleSearch} disabled={!hasActiveFilter} style={{ flex: 1, padding: '10px', background: hasActiveFilter ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: hasActiveFilter ? 'white' : '#64748b', fontWeight: '600', cursor: hasActiveFilter ? 'pointer' : 'not-allowed', fontSize: '13px' }}>🔍 Ara ({hasActiveFilter ? filtered.length : 0} sonuç)</button>
              <button onClick={clearFilters} style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>✕ Temizle</button>
              {showResults && filtered.length > 0 && (
                <button onClick={() => exportToExcel(filtered, `Musteri_Arama_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '10px 16px', background: 'rgba(16,185,129,0.2)', border: 'none', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '13px' }}>📥 Excel</button>
              )}
            </div>
          </div>

          {/* Arama Sonuçları */}
          {showResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Arama kriterlerine uygun müşteri bulunamadı</p>
              ) : (
                filtered.map(c => renderCustomerCard(c))
              )}
            </div>
          )}
          
          {!showResults && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p style={{ fontSize: '14px' }}>Yukarıdaki filtrelerden en az birini doldurup "Ara" butonuna tıklayın</p>
            </div>
          )}
        </>
      )}

      {/* PASAPORT UYARI SEKMESİ */}
      {activeTab === 'expiring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#f59e0b' }}>⚠️ 6 ay içinde pasaportu bitecek müşteriler</p>
            {expiringPassports.length > 0 && (
              <button onClick={() => exportToExcel(expiringPassports, `Pasaport_Uyari_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', border: 'none', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {expiringPassports.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>6 ay içinde pasaportu bitecek müşteri yok 🎉</p>
          ) : (
            expiringPassports.map(c => {
              const pList = safeParseJSON(c.passports);
              const expP = pList.find(p => { const d = getDaysLeft(p.expiryDate); return d !== null && d > 0 && d <= 180; });
              return (
                <div key={c.id} style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: '600' }}>{getDaysLeft(expP?.expiryDate)} gün kaldı</span>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Bitiş: {formatDate(expP?.expiryDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DOĞUM GÜNÜ SEKMESİ */}
      {activeTab === 'birthday' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#f59e0b' }}>🎂 Bugün doğum günü olanlar</p>
            {todayBirthdays.length > 0 && (
              <button onClick={() => exportToExcel(todayBirthdays, `Dogum_Gunu_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', border: 'none', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {todayBirthdays.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Bugün doğum günü olan müşteri yok</p>
          ) : (
            todayBirthdays.map(c => (
              <div key={c.id} style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>🎂 {c.firstName} {c.lastName}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#f59e0b' }}>Doğum Günün Kutlu Olsun!</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SCHENGEN VİZESİ OLANLAR */}
      {activeTab === 'schengen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#10b981' }}>🇪🇺 Schengen vizesi olan müşteriler</p>
            {withSchengen.length > 0 && (
              <button onClick={() => exportToExcel(withSchengen, `Schengen_Vizeli_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', border: 'none', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {withSchengen.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Schengen vizesi olan müşteri yok</p>
          ) : (
            withSchengen.map(c => {
              const visas = safeParseJSON(c.schengenVisas).filter(v => v.country);
              const activeVisa = visas.find(v => getDaysLeft(v.endDate) > 0);
              return (
                <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {activeVisa && (
                        <>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.3)', color: '#10b981', fontWeight: '600' }}>{activeVisa.country}</span>
                          <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Bitiş: {formatDate(activeVisa.endDate)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SCHENGEN 3 AY İÇİNDE BİTECEK */}
      {activeTab === 'schengenExpiring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#eab308' }}>🇪🇺⏰ 3 ay içinde Schengen vizesi bitecek müşteriler</p>
            {schengenExpiring.length > 0 && (
              <button onClick={() => exportToExcel(schengenExpiring, `Schengen_Uyari_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(234,179,8,0.2)', border: 'none', borderRadius: '6px', color: '#eab308', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {schengenExpiring.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>3 ay içinde Schengen vizesi bitecek müşteri yok 🎉</p>
          ) : (
            schengenExpiring.map(c => {
              const visas = safeParseJSON(c.schengenVisas);
              const expVisa = visas.find(v => { const d = getDaysLeft(v.endDate); return d !== null && d > 0 && d <= 90; });
              return (
                <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(234,179,8,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(234,179,8,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone} • {expVisa?.country}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(234,179,8,0.3)', color: '#eab308', fontWeight: '600' }}>{getDaysLeft(expVisa?.endDate)} gün kaldı</span>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Bitiş: {formatDate(expVisa?.endDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABD VİZESİ OLANLAR */}
      {activeTab === 'usa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#8b5cf6' }}>🇺🇸 ABD vizesi olan müşteriler</p>
            {withUsa.length > 0 && (
              <button onClick={() => exportToExcel(withUsa, `ABD_Vizeli_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.2)', border: 'none', borderRadius: '6px', color: '#8b5cf6', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {withUsa.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>ABD vizesi olan müşteri yok</p>
          ) : (
            withUsa.map(c => {
              const visa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
              return (
                <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139,92,246,0.3)', color: '#8b5cf6', fontWeight: '600' }}>🇺🇸 ABD</span>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Bitiş: {formatDate(visa.endDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABD 1 AY İÇİNDE BİTECEK */}
      {activeTab === 'usaExpiring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#ef4444' }}>🇺🇸⏰ 1 ay içinde ABD vizesi bitecek müşteriler</p>
            {usaExpiring.length > 0 && (
              <button onClick={() => exportToExcel(usaExpiring, `ABD_Uyari_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {usaExpiring.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>1 ay içinde ABD vizesi bitecek müşteri yok 🎉</p>
          ) : (
            usaExpiring.map(c => {
              const visa = c.usaVisa ? (typeof c.usaVisa === 'string' ? JSON.parse(c.usaVisa || '{}') : c.usaVisa) : {};
              return (
                <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: '600' }}>{getDaysLeft(visa.endDate)} gün kaldı</span>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Bitiş: {formatDate(visa.endDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* YEŞİL PASAPORT SEKMESİ */}
      {activeTab === 'greenPassport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#059669' }}>🟢 Yeşil Pasaport (Hususi) sahibi müşteriler</p>
            {withGreenPassport.length > 0 && (
              <button onClick={() => exportToExcel(withGreenPassport, `Yesil_Pasaport_${new Date().toLocaleDateString('tr')}`)} style={{ padding: '6px 12px', background: 'rgba(5,150,105,0.2)', border: 'none', borderRadius: '6px', color: '#059669', cursor: 'pointer', fontSize: '11px' }}>📥 Excel</button>
            )}
          </div>
          {withGreenPassport.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Yeşil Pasaport sahibi müşteri yok</p>
          ) : (
            withGreenPassport.map(c => {
              const pList = safeParseJSON(c.passports);
              const greenPassport = pList.find(p => p.passportType === 'Yeşil Pasaport (Hususi)');
              return (
                <div key={c.id} onClick={() => setSelectedCustomer(c)} style={{ background: 'rgba(5,150,105,0.1)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(5,150,105,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{c.firstName} {c.lastName}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{c.phone}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(5,150,105,0.3)', color: '#059669', fontWeight: '600' }}>🟢 Yeşil</span>
                      {greenPassport?.passportNo && (
                        <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>No: {greenPassport.passportNo}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Excel Modal */}
      {showExcelModal && (
        <Modal title="📊 Excel İşlemleri" onClose={() => setShowExcelModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#10b981' }}>📥 Excel'den Yükle</h4>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>Excel dosyanızda şu sütunlar olmalı: Ad, Soyad, TC Kimlik, Telefon, E-posta, Doğum Tarihi, Doğum Yeri, İkametgah İli, TK Üyelik No, Sektör, Firma, Notlar</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelImport} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '10px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontSize: '12px' }}>📂 Dosya Seç</button>
            </div>
            
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#3b82f6' }}>📤 Excel'e Aktar</h4>
              <button onClick={() => exportToExcel(customers, `Tum_Musteriler_${new Date().toLocaleDateString('tr')}`)} style={{ width: '100%', padding: '10px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}>📥 Tüm Müşterileri İndir ({customers.length})</button>
            </div>
          </div>
        </Modal>
      )}

      {showForm && renderFullPageForm()}
      {selectedCustomer && renderFullPageDetail()}

      {/* Image Preview */}
      {imagePreview.show && (
        <div onClick={() => setImagePreview({ show: false, src: '', title: '' })} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '20px' }}>
          <div style={{ maxWidth: '90%', maxHeight: '90%' }}>
            <p style={{ color: 'white', textAlign: 'center', marginBottom: '10px', fontSize: '14px' }}>{imagePreview.title}</p>
            <img src={imagePreview.src} alt={imagePreview.title} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>Kapatmak için tıklayın</p>
          </div>
        </div>
      )}
    </div>
  );
}

// VİZE MODÜLÜ
function VisaModule({ customers, visaApplications, setVisaApplications, isMobile, onNavigateToCustomers, appSettings, showToast, addToUndo }) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [visaSearchQuery, setVisaSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dayDetailModal, setDayDetailModal] = useState(null);
  const [editingVisa, setEditingVisa] = useState(null);
  const [formData, setFormData] = useState({});
  const [checklist, setChecklist] = useState({ passportValid: null, passportCondition: null, addressChecked: null });
  const [selectedVisa, setSelectedVisa] = useState(null);

  const paymentStatuses = ['Ödenmedi', 'Kısmi Ödendi', 'Ödendi'];

  // Vize kategorileri - durations appSettings'ten alınır
  const visaCategories = [
    { id: 'schengen', label: 'Schengen', icon: '🇪🇺', color: '#10b981', countries: ['Almanya', 'Fransa', 'İtalya', 'İspanya', 'Hollanda', 'Belçika', 'Avusturya', 'Yunanistan', 'Portekiz', 'Polonya', 'Çekya', 'Macaristan', 'İsviçre', 'Danimarka', 'İsveç', 'Norveç', 'Finlandiya'], durations: null },
    { id: 'usa', label: 'Amerika', icon: '🇺🇸', color: '#3b82f6', countries: ['Amerika Birleşik Devletleri'], durations: appSettings?.visaDurations?.usa || null },
    { id: 'russia', label: 'Rusya', icon: '🇷🇺', color: '#ef4444', countries: ['Rusya'], durations: appSettings?.visaDurations?.russia || null },
    { id: 'uk', label: 'İngiltere', icon: '🇬🇧', color: '#8b5cf6', countries: ['İngiltere'], durations: appSettings?.visaDurations?.uk || null },
    { id: 'uae', label: 'BAE', icon: '🇦🇪', color: '#f59e0b', countries: ['Birleşik Arap Emirlikleri', 'Dubai', 'Abu Dabi'], durations: appSettings?.visaDurations?.uae || null },
    { id: 'china', label: 'Çin', icon: '🇨🇳', color: '#dc2626', countries: ['Çin'], durations: appSettings?.visaDurations?.china || null },
    { id: 'other', label: 'Diğer', icon: '🌍', color: '#64748b', countries: ['Kanada', 'Avustralya', 'Japonya', 'Hindistan', 'Güney Kore', 'Brezilya', 'Meksika', 'Diğer'], durations: null }
  ];

  const visaTypes = ['Ticari', 'Turistik', 'Aile/Arkadaş Ziyareti', 'Fuar Katılımcı', 'Tedavi', 'Eğitim', 'Transit', 'Diğer'];
  const visaStatuses = ['Evrak Topluyor', 'Evrak Tamamlandı', 'Randevu Alındı', 'Başvuru Yapıldı', 'Sonuç Bekliyor', 'Onaylandı', 'Reddedildi'];

  // Hex to RGBA helper
  const hexToRgb = (hex) => {
    const colorMap = {
      '#10b981': '16,185,129',
      '#3b82f6': '59,130,246',
      '#ef4444': '239,68,68',
      '#8b5cf6': '139,92,246',
      '#f59e0b': '245,158,11',
      '#dc2626': '220,38,38',
      '#64748b': '100,116,139'
    };
    return colorMap[hex] || '100,116,139';
  };

  // Vize başvuruları arama/filtreleme
  const filteredVisaApplications = visaSearchQuery.length >= 2
    ? visaApplications.filter(v =>
        v.customerName?.toLowerCase().includes(visaSearchQuery.toLowerCase()) ||
        v.customerPhone?.includes(visaSearchQuery) ||
        v.country?.toLowerCase().includes(visaSearchQuery.toLowerCase()) ||
        v.pnr?.toLowerCase().includes(visaSearchQuery.toLowerCase())
      )
    : visaApplications;

  // Excel export fonksiyonu
  const exportToExcel = () => {
    if (visaApplications.length === 0) {
      showToast?.('Export edilecek vize başvurusu yok', 'warning');
      return;
    }
    const data = visaApplications.map(v => ({
      'Müşteri Adı': v.customerName || '',
      'Telefon': v.customerPhone || '',
      'Kategori': getCategoryInfo(v.category)?.label || v.category || '',
      'Ülke': v.country || '',
      'Vize Türü': v.visaType || '',
      'Vize Süresi': v.visaDuration || '',
      'Başvuru Tarihi': formatDate(v.applicationDate) || '',
      'Randevu Tarihi': formatDate(v.appointmentDate) || '',
      'Randevu Saati': v.appointmentTime || '',
      'PNR': v.pnr || '',
      'İşlem': v.processor || '',
      'Ödeme Durumu': v.paymentStatus || '',
      'Durum': v.status || '',
      'Notlar': v.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vize Başvuruları');
    XLSX.writeFile(wb, `vize-basvurulari-${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast?.(`${visaApplications.length} başvuru Excel'e aktarıldı`, 'success');
  };

  // Arama sonuçları (form için müşteri arama)
  const searchResults = searchQuery.length >= 2 
    ? customers.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      ).slice(0, 10)
    : [];

  // 10 gün ve altı randevular
  const upcomingReminders = visaApplications.filter(v => {
    if (!v.appointmentDate) return false;
    const days = getDaysLeft(v.appointmentDate);
    return days !== null && days >= 0 && days <= 10;
  }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

  // Takvim
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const getMonthDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startPadding; i++) days.push({ day: null, date: null });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const appointments = visaApplications.filter(v => v.appointmentDate === dateStr);
      days.push({ day: d, date: dateStr, appointments });
    }
    return days;
  };

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const month1Days = getMonthDays(calendarYear, calendarMonth);
  const month2Year = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
  const month2Month = calendarMonth === 11 ? 0 : calendarMonth + 1;
  const month2Days = getMonthDays(month2Year, month2Month);

  const resetForm = () => {
    setFormStep('search');
    setSearchQuery('');
    setSelectedCustomer(null);
    setSelectedCategory(null);
    setChecklist({ passportValid: null, passportCondition: null, addressChecked: null });
    setFormData({});
    setEditingVisa(null);
  };

  const openNewForm = () => { resetForm(); setShowForm(true); };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormStep('checklist');
  };

  const handleChecklistNext = () => {
    if (checklist.passportValid !== 'yes') {
      alert('⚠️ Pasaport geçerlilik tarihi uygun değil!\n\nSeyahat dönüş tarihinden itibaren 6 ay geçerli olmalı.');
      return;
    }
    if (checklist.passportCondition !== 'no') {
      alert('⚠️ Pasaportta yırtık/çizik var!\n\nBaşvuru yapılamaz, yeni pasaport gerekli.');
      return;
    }
    if (checklist.addressChecked !== 'yes') {
      alert('⚠️ İkametgah adresi kontrol edilmeli!\n\nBölge ayrımı önemli, doğru konsolosluk belirlenmeli.');
      return;
    }
    setFormStep('category');
  };

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setFormStep('details');
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      customerId: selectedCustomer.id,
      customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      customerPhone: selectedCustomer.phone,
      customerEmail: selectedCustomer.email || '',
      category: cat.id,
      country: '',
      visaType: '',
      applicationDate: today,
      appointmentDate: '',
      appointmentTime: '',
      pnr: '',
      processor: appSettings?.processors?.[0] || 'Paydos',
      paymentStatus: 'Ödenmedi',
      status: 'Evrak Topluyor',
      notes: '',
      price: '',
      cost: '',
      currency: '€'
    });
  };

  const sendWhatsAppReminder = (visa) => {
    if (!visa.appointmentDate || !visa.customerPhone) {
      alert('Randevu tarihi veya telefon numarası eksik!');
      return;
    }
    let message = appSettings?.whatsappTemplate || 'Randevu bilgileriniz: {tarih}';
    message = message
      .replace('{isim}', visa.customerName || '')
      .replace('{ulke}', visa.country || '')
      .replace('{tarih}', formatDate(visa.appointmentDate) || '')
      .replace('{saat}', visa.appointmentTime || '')
      .replace('{pnr}', visa.pnr || '-');
    
    const phone = visa.customerPhone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('90') ? phone : `90${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendEmail = (visa) => {
    if (!visa.customerEmail) {
      alert('Müşteri e-posta adresi bulunamadı!');
      return;
    }
    const subject = `${visa.country} Vize Randevu Bilgisi`;
    const body = `Sayın ${visa.customerName},\n\n${visa.country} vize randevunuz ${formatDate(visa.appointmentDate)} tarihinde${visa.appointmentTime ? ` saat ${visa.appointmentTime}` : ''} için alınmıştır.\n\nPNR: ${visa.pnr || '-'}\n\nPaydos Turizm`;
    window.open(`mailto:${visa.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const sendWhatsApp = (visa) => {
    const phone = visa.customerPhone?.replace(/\D/g, '');
    if (!phone) return;
    const fullPhone = phone.startsWith('90') ? phone : `90${phone}`;
    window.open(`https://wa.me/${fullPhone}`, '_blank');
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.country || !formData.visaType) {
      showToast?.('Ülke ve vize türü seçiniz', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingVisa) {
        const oldVisa = visaApplications.find(v => v.id === editingVisa.id);
        const updated = visaApplications.map(v => v.id === editingVisa.id ? { ...formData, id: editingVisa.id } : v);
        setVisaApplications(updated);
        addToUndo?.({ type: 'update', undo: () => setVisaApplications(visaApplications.map(v => v.id === editingVisa.id ? oldVisa : v)) });
        try { await supabase.from('visa_applications').update(toSnakeCase(formData)).eq('id', editingVisa.id); } catch (err) { console.error(err); }
        showToast?.('Vize başvurusu güncellendi', 'success');
      } else {
        const newVisa = { ...formData, id: generateUniqueId(), createdAt: new Date().toISOString() };
        setVisaApplications([...visaApplications, newVisa]);
        addToUndo?.({ type: 'create', undo: () => setVisaApplications(prev => prev.filter(v => v.id !== newVisa.id)) });
        try { await supabase.from('visa_applications').insert([toSnakeCase(newVisa)]); } catch (err) { console.error(err); }
        showToast?.(`${formData.customerName} için vize başvurusu oluşturuldu`, 'success');
      }
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const deleteVisa = async (id) => {
    const visaToDelete = visaApplications.find(v => v.id === id);
    if (!visaToDelete) return;
    
    setVisaApplications(visaApplications.filter(v => v.id !== id));
    setSelectedVisa(null);
    
    // Undo ile geri alınabilir toast
    showToast?.(`${visaToDelete.customerName} başvurusu silindi`, 'warning', () => {
      setVisaApplications(prev => [...prev, visaToDelete]);
      supabase.from('visa_applications').insert([toSnakeCase(visaToDelete)]).catch(console.error);
    });
    
    try { await supabase.from('visa_applications').delete().eq('id', id); } catch (err) { console.error(err); }
  };

  const openEditVisa = (visa) => {
    const customer = customers.find(c => c.id === visa.customerId);
    const cat = visaCategories.find(c => c.id === visa.category);
    setSelectedCustomer(customer);
    setSelectedCategory(cat);
    setFormData(visa);
    setEditingVisa(visa);
    setFormStep('details');
    setShowForm(true);
  };

  const getStatusColor = (status) => ({
    'Evrak Topluyor': '#f59e0b', 'Evrak Tamamlandı': '#3b82f6', 'Randevu Alındı': '#8b5cf6',
    'Başvuru Yapıldı': '#6366f1', 'Sonuç Bekliyor': '#14b8a6', 'Onaylandı': '#10b981', 'Reddedildi': '#ef4444'
  }[status] || '#94a3b8');

  const getCategoryInfo = (catId) => visaCategories.find(c => c.id === catId) || visaCategories[5];

  // Takvim renderı
  const renderCalendar = (days, monthName, year) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#f59e0b', textAlign: 'center' }}>{monthName} {year}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '10px' }}>
        {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#64748b', padding: '4px', fontWeight: '600' }}>{d}</div>
        ))}
        {days.map((d, idx) => {
          const isToday = d.date === today.toISOString().split('T')[0];
          const hasAppointments = d.appointments?.length > 0;
          return (
            <div 
              key={idx} 
              onClick={() => hasAppointments && setDayDetailModal({ date: d.date, appointments: d.appointments })}
              style={{ 
                textAlign: 'center', padding: '4px 2px', borderRadius: '6px', minHeight: '32px',
                background: hasAppointments ? 'rgba(245,158,11,0.2)' : 'transparent',
                border: isToday ? '2px solid #f59e0b' : '1px solid transparent',
                color: d.day ? '#e8f1f8' : 'transparent',
                cursor: hasAppointments ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span style={{ fontWeight: isToday ? '700' : '400' }}>{d.day || ''}</span>
              {hasAppointments && (
                <span style={{ fontSize: '8px', color: '#f59e0b', marginTop: '1px' }}>
                  {d.appointments.length > 2 ? `${d.appointments.length} randevu` : d.appointments.map(a => a.customerName?.split(' ')[0]).join(', ')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // FORM RENDER
  const renderForm = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #0a1628 0%, #132742 50%, #0a1628 100%)', zIndex: 300, overflow: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, background: 'rgba(10,22,40,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <button onClick={() => {
          console.log('Geri tıklandı, mevcut step:', formStep);
          if (formStep === 'search') {
            // Adım 1'deyse formu kapat
            console.log('Adım 1, kapatılıyor');
            resetForm();
            setShowForm(false);
          } else if (formStep === 'checklist') {
            // Adım 2'deyse Adım 1'e dön
            console.log('Adım 2 → 1');
            setSelectedCustomer(null);
            setChecklist({ passportValid: null, passportCondition: null, addressChecked: null });
            setFormStep('search');
          } else if (formStep === 'category') {
            // Adım 3'teyse Adım 2'ye dön
            console.log('Adım 3 → 2');
            setSelectedCategory(null);
            setFormData({});
            setFormStep('checklist');
          } else if (formStep === 'details') {
            // Adım 4'teyse Adım 3'e dön
            console.log('Adım 4 → 3');
            setFormData({});
            setFormStep('category');
          }
        }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', color: '#e8f1f8', cursor: 'pointer', fontSize: '14px' }}>← Geri</button>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>{editingVisa ? '✏️ Vize Düzenle' : '🌍 Yeni Vize Başvurusu'}</h2>
        <div style={{ width: '70px' }}></div>
      </div>

      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        {/* ADIM 1: MÜŞTERİ ARA */}
        {formStep === 'search' && (
          <div>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>📋 Adım 1/4: Müşteri Seçimi</p>
            </div>
            
            <input
              type="text"
              placeholder="🔍 Müşteri ara (ad, soyad veya telefon)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e8f1f8', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
            />

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(c => (
                  <div key={c.id} onClick={() => selectCustomer(c)} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{c.firstName} {c.lastName}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{c.phone} • {c.city || '-'}</p>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>Müşteri bulunamadı</p>
                <button onClick={onNavigateToCustomers} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#0c1929', fontWeight: '600', cursor: 'pointer' }}>
                  ➕ Yeni Müşteri Ekle
                </button>
              </div>
            )}

            {searchQuery.length < 2 && (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>En az 2 karakter girin</p>
            )}
          </div>
        )}

        {/* ADIM 2: KONTROL LİSTESİ */}
        {formStep === 'checklist' && selectedCustomer && (
          <div>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#f59e0b' }}>📋 Adım 2/4: Kontrol Listesi</p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>Müşteri: <strong style={{ color: '#fff' }}>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Soru 1 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600' }}>🛂 Pasaportun geçerlilik tarihini kontrol ettiniz mi?</p>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b' }}>Seyahat dönüş tarihinden itibaren 6 ay geçerli olmalı.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setChecklist({...checklist, passportValid: 'yes'})} style={{ flex: 1, padding: '12px', background: checklist.passportValid === 'yes' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.passportValid === 'yes' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.passportValid === 'yes' ? '#10b981' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✓ Evet, Geçerli</button>
                  <button onClick={() => setChecklist({...checklist, passportValid: 'no'})} style={{ flex: 1, padding: '12px', background: checklist.passportValid === 'no' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.passportValid === 'no' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.passportValid === 'no' ? '#ef4444' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✗ Hayır</button>
                </div>
              </div>

              {/* Soru 2 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600' }}>📄 Pasaportta yırtık veya çizik var mı?</p>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b' }}>Hasarlı pasaportla başvuru yapılamaz.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setChecklist({...checklist, passportCondition: 'yes'})} style={{ flex: 1, padding: '12px', background: checklist.passportCondition === 'yes' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.passportCondition === 'yes' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.passportCondition === 'yes' ? '#ef4444' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✗ Evet, Var</button>
                  <button onClick={() => setChecklist({...checklist, passportCondition: 'no'})} style={{ flex: 1, padding: '12px', background: checklist.passportCondition === 'no' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.passportCondition === 'no' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.passportCondition === 'no' ? '#10b981' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✓ Hayır, Temiz</button>
                </div>
              </div>

              {/* Soru 3 */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600' }}>📍 İkametgah adresini kontrol ettiniz mi?</p>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b' }}>Bölge ayrımı var, doğru konsolosluk belirlenmeli.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setChecklist({...checklist, addressChecked: 'yes'})} style={{ flex: 1, padding: '12px', background: checklist.addressChecked === 'yes' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.addressChecked === 'yes' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.addressChecked === 'yes' ? '#10b981' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✓ Evet, Kontrol Ettim</button>
                  <button onClick={() => setChecklist({...checklist, addressChecked: 'no'})} style={{ flex: 1, padding: '12px', background: checklist.addressChecked === 'no' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)', border: checklist.addressChecked === 'no' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: checklist.addressChecked === 'no' ? '#ef4444' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>✗ Hayır</button>
                </div>
              </div>
            </div>

            <button onClick={handleChecklistNext} disabled={!checklist.passportValid || !checklist.passportCondition || !checklist.addressChecked} style={{ width: '100%', marginTop: '24px', padding: '16px', background: (checklist.passportValid && checklist.passportCondition && checklist.addressChecked) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: (checklist.passportValid && checklist.passportCondition && checklist.addressChecked) ? '#0c1929' : '#64748b', fontWeight: '700', fontSize: '15px', cursor: (checklist.passportValid && checklist.passportCondition && checklist.addressChecked) ? 'pointer' : 'not-allowed' }}>
              Devam Et →
            </button>
          </div>
        )}

        {/* ADIM 3: VİZE KATEGORİSİ SEÇ */}
        {formStep === 'category' && (
          <div>
            <div style={{ background: 'rgba(139,92,246,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#8b5cf6' }}>📋 Adım 3/4: Vize Türü Seçimi</p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>Müşteri: <strong style={{ color: '#fff' }}>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {visaCategories.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat)} style={{ padding: '20px', background: `rgba(${hexToRgb(cat.color)},0.15)`, border: `1px solid ${cat.color}40`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{cat.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: cat.color }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ADIM 4: DETAYLAR */}
        {formStep === 'details' && selectedCategory && (
          <div>
            <div style={{ background: `rgba(${hexToRgb(selectedCategory.color)},0.1)`, padding: '16px', borderRadius: '12px', marginBottom: '20px', border: `1px solid ${selectedCategory.color}30` }}>
              <p style={{ margin: 0, fontSize: '13px', color: selectedCategory.color }}>{selectedCategory.icon} Adım 4/4: {selectedCategory.label} Vize Detayları</p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>Müşteri: <strong style={{ color: '#fff' }}>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Ülke Seçimi - Butonlar */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Ülke * {formData.country && <span style={{ color: '#10b981' }}>✓ {formData.country}</span>}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                  {selectedCategory.countries.map(c => (
                    <button key={c} type="button" onClick={() => setFormData({...formData, country: c})} style={{ padding: '10px 8px', background: formData.country === c ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: formData.country === c ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: formData.country === c ? '#10b981' : '#e8f1f8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.country === c ? '600' : '400' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vize Türü - Amerika için dropdown, diğerleri buton */}
              {selectedCategory?.id === 'usa' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Vize Türü *</label>
                  <select 
                    value={formData.visaType || ''} 
                    onChange={e => setFormData({...formData, visaType: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">Vize türü seçin</option>
                    <option value="B1/B2 Turistik ve Ticari (İş) Vize">B1/B2 Turistik ve Ticari (İş) Vize</option>
                  </select>
                </div>
              ) : selectedCategory && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Vize Türü * {formData.visaType && <span style={{ color: '#3b82f6' }}>✓ {formData.visaType}</span>}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {visaTypes.map(t => (
                      <button key={t} type="button" onClick={() => setFormData({...formData, visaType: t})} style={{ padding: '10px 8px', background: formData.visaType === t ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)', border: formData.visaType === t ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: formData.visaType === t ? '#3b82f6' : '#e8f1f8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.visaType === t ? '600' : '400' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vize Süresi - İngiltere, Amerika, BAE için */}
              {selectedCategory?.durations && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Vize Süresi * {formData.visaDuration && <span style={{ color: selectedCategory.color }}>✓ {formData.visaDuration}</span>}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {selectedCategory.durations.map(d => (
                      <button key={d} type="button" onClick={() => setFormData({...formData, visaDuration: d})} style={{ padding: '12px 8px', background: formData.visaDuration === d ? `${selectedCategory.color}30` : 'rgba(255,255,255,0.05)', border: formData.visaDuration === d ? `2px solid ${selectedCategory.color}` : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: formData.visaDuration === d ? selectedCategory.color : '#e8f1f8', cursor: 'pointer', fontSize: '12px', fontWeight: formData.visaDuration === d ? '600' : '400' }}>
                        {selectedCategory.icon} {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Başvuru Tarihi ve İşlem */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Başvuru Tarihi</label>
                  <input type="date" value={formData.applicationDate || ''} onChange={e => setFormData({...formData, applicationDate: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>İşlem</label>
                  <select value={formData.processor || ''} onChange={e => setFormData({...formData, processor: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }}>
                    {(appSettings?.processors || ['Paydos', 'İdata', 'Oğuz']).map(p => <option key={p} value={p} style={{ background: '#ffffff', color: '#000000' }}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Randevu Tarihi ve Saati */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Randevu Tarihi</label>
                  <input type="date" value={formData.appointmentDate || ''} onChange={e => setFormData({...formData, appointmentDate: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Randevu Saati</label>
                  <input type="time" value={formData.appointmentTime || ''} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* PNR */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>PNR / Referans No</label>
                <input type="text" value={formData.pnr || ''} onChange={e => setFormData({...formData, pnr: e.target.value})} placeholder="Randevu PNR numarası" style={{ width: '100%', padding: '12px', background: '#0d1f33', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* Ödeme Durumu */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Vize Ücreti</label>
export default function TestPart1() { return null; }
