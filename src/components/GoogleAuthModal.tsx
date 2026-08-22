import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { isSpecialVipUser } from '../data/skins';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import { 
  X, 
  Check, 
  Mail, 
  LogIn, 
  UserPlus, 
  Gift, 
  Shuffle,
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface GoogleAuthModalProps {
  currentUser: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, name: string, avatar?: string, password?: string) => void;
}

const AVATAR_OPTIONS = [
  { id: '1', name: 'سلطان اللودو', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingSultan' },
  { id: '2', name: 'أمير النرد', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RoyalKnight' },
  { id: '3', name: 'الملكة الملكية', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PrincessLudo' },
  { id: '4', name: 'السايبر روبوت', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberHero' },
  { id: '5', name: 'الصقر الذهبي', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FalconEagle' },
  { id: '6', name: 'النينجا البطل', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaMaster' },
  { id: '7', name: 'إمبراطور الذهب', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldEmperor' },
  { id: '8', name: 'البطل الميكانيكي', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaKing' },
];

const SUGGESTED_NAMES = [
  'بطل اللودو',
  'سلطان النرد',
  'الصقر الجارح',
  'قاهر البيادق',
  'زعيم الطاولة',
  'ملك الاستراتيجية',
  'صاحب السعادة',
  'برنس اللعبة',
];

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  currentUser,
  lang,
  isOpen,
  onClose,
  onLogin,
}) => {
  const [authTab, setAuthTab] = useState<'register' | 'google'>('register');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const t = translations[lang];

  if (!isOpen) return null;

  const handleRandomName = () => {
    sound.playClick();
    const randomIndex = Math.floor(Math.random() * SUGGESTED_NAMES.length);
    setCustomName(SUGGESTED_NAMES[randomIndex]);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!customName.trim()) {
      setErrorMessage('يرجى كتابة اسم اللاعب.');
      return;
    }
    if (customPassword.length < 4) {
      setErrorMessage('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل.');
      return;
    }

    sound.playVictory();
    onLogin(
      customEmail.trim(),
      customName.trim(),
      selectedAvatar,
      customPassword
    );
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!googleEmail.trim() || !googleName.trim()) {
      setErrorMessage('يرجى ملء البريد الإلكتروني واسم اللاعب.');
      return;
    }
    if (googlePassword.length < 4) {
      setErrorMessage('يرجى إدخال كلمة المرور (4 خانات على الأقل).');
      return;
    }

    sound.playVictory();
    onLogin(
      googleEmail.trim(),
      googleName.trim(),
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleName.trim())}`,
      googlePassword
    );
  };

  const handleGuestLogin = () => {
    sound.playClick();
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    onLogin('', `لاعب ${guestNum}`, AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 sm:p-7 flex flex-col shadow-2xl relative text-white max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 end-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-2.5 shadow-xl flex items-center justify-center text-slate-950 mb-2">
            <Gamepad2 size={28} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            تسجيل الدخول وإنشاء حساب محمي
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs">
            سجل حسابك بكلمة مرور لحفظ رصيدك، سكناتك، ومستواك بأمان
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 bg-rose-500/20 border border-rose-500/50 rounded-2xl p-2.5 flex items-center gap-2 text-rose-300 text-xs font-bold animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setErrorMessage('');
              setAuthTab('register');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              authTab === 'register'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={16} />
            <span>حساب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setErrorMessage('');
              setAuthTab('google');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              authTab === 'google'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound size={16} />
            <span>تسجيل دخول</span>
          </button>
        </div>

        {/* TAB 1: CREATE PERSONAL ACCOUNT */}
        {authTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in duration-200">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اختر صورتك الرمزية (الأفاتار):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatar === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedAvatar(av.url);
                      }}
                      className={`relative rounded-2xl p-1.5 border transition-all flex flex-col items-center bg-slate-800/80 ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-500/10 scale-105 shadow-md'
                          : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className="text-[9px] font-bold text-slate-300 mt-1 truncate max-w-full">
                        {av.name}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">اسم اللاعب (اسمك في اللعبة):</label>
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Shuffle size={12} />
                  <span>اسم عشوائي</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="أدخل اسمك هنا (مثال: سلطان اللودو)"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                البريد الإلكتروني (لحفظ واسترجاع الحساب):
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Password Input for Register */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                كلمة المرور (باسورد الحساب):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور سرية (4 خانات على الأقل)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl ps-10 pe-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Welcome Bonus Notice */}
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-purple-500/15 border border-amber-500/30 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-amber-400 animate-bounce" />
                <div className="text-xs">
                  <div className="font-bold text-white">هدية ترحيبية فورية:</div>
                  <div className="text-amber-300 font-black">+1,000 ذهب 🪙 + 20 جوهرة 💎</div>
                </div>
              </div>
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={!customName.trim() || customPassword.length < 4}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              id="submit-register-btn"
            >
              <ShieldCheck size={18} />
              <span>إنشاء الحساب وبدء اللعب 🎲</span>
            </button>
          </form>
        )}

        {/* TAB 2: LOGIN WITH EMAIL & PASSWORD */}
        {authTab === 'google' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Google Icon Banner */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/80 border border-slate-700 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-white">تسجيل الدخول بالبريد وكلمة المرور</div>
                <div className="text-[11px] text-slate-400">ادخل بيانات حسابك لاسترجاع رصيدك ومستواك فوراً</div>
              </div>
            </div>

            {/* Custom Account Login Form */}
            <form onSubmit={handleGoogleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم اللاعب:</label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="مثال: أحمد المحترف"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور (باسورد):</label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showGooglePassword ? 'text' : 'password'}
                    required
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl ps-10 pe-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGooglePassword(!showGooglePassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showGooglePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!googleEmail.trim() || !googleName.trim() || googlePassword.length < 4}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                <span>تسجيل الدخول بالحساب</span>
              </button>
            </form>

            {/* Guest Entry */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs transition-colors"
            >
              {t.continueAsGuest}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


