import React, { useEffect, useRef, useState } from 'react';
import { BRAND_TAGLINE, POWERED_BY, PRODUCT_NAME, SHORT_NAME } from '../config/brandConfig';
import {
  AlertCircle,
  CornerDownLeft,
  Delete,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  User,
  X,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { playTerminalSound } from '../utils/formatters';

export const LoginPortal: React.FC = () => {
  const { loginWithCredentials, language, toggleLanguage, staffDirectory, refetchCloudCatalog, isCloudSyncing } = usePos();

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Virtual Keyboard: Completely HIDDEN on initial load
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password'>('username');
  const [isCapsLock, setIsCapsLock] = useState<boolean>(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Outside click dismissal: Dismiss virtual keyboard when tapping anywhere outside card & keyboard
  useEffect(() => {
    if (!showKeyboard) return;
    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (cardRef.current?.contains(target) || keyboardRef.current?.contains(target)) {
        return;
      }
      setShowKeyboard(false);
    };

    window.addEventListener('mousedown', handleOutsideInteraction);
    window.addEventListener('touchstart', handleOutsideInteraction);
    return () => {
      window.removeEventListener('mousedown', handleOutsideInteraction);
      window.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [showKeyboard]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = loginWithCredentials(usernameInput, passwordInput);
    if (!res.ok) {
      setErrorMsg(res.error || 'Authentication failed. Please verify your credentials.');
      setIsSubmitting(false);
    }
  };

  // Virtual Keyboard Input Handlers
  const handleVirtualKeyPress = (char: string) => {
    playTerminalSound('tap');
    const target = focusedField;
    const finalChar = isCapsLock ? char.toUpperCase() : char.toLowerCase();

    if (target === 'username') {
      setUsernameInput((prev) => prev + finalChar);
      usernameInputRef.current?.focus();
    } else {
      setPasswordInput((prev) => prev + finalChar);
      passwordInputRef.current?.focus();
    }
  };

  const handleVirtualBackspace = () => {
    playTerminalSound('tap');
    const target = focusedField;

    if (target === 'username') {
      setUsernameInput((prev) => prev.slice(0, -1));
      usernameInputRef.current?.focus();
    } else {
      setPasswordInput((prev) => prev.slice(0, -1));
      passwordInputRef.current?.focus();
    }
  };

  const handleVirtualFieldSwitch = () => {
    playTerminalSound('tap');
    setFocusedField((prev) => {
      const next = prev === 'username' ? 'password' : 'username';
      if (next === 'username') {
        usernameInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return next;
    });
  };

  const QWERTY_NUM_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '@'];
  const QWERTY_ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const QWERTY_ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const QWERTY_ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div
      className={`min-h-screen w-full bg-[#FAF6F0] text-[#1E293B] flex flex-col justify-between relative overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-out ${
        showKeyboard ? 'pb-72 sm:pb-80' : ''
      }`}
    >
      {/* Top Header: Clean Language Switcher Only */}
      <div className="max-w-md w-full mx-auto flex items-center justify-end">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E1D5] bg-white hover:bg-stone-50 text-xs font-bold font-mono text-stone-700 shadow-xs transition active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-stone-500" />
          <span>{language === 'en' ? 'Language: EN' : 'اللغة: العربية'}</span>
        </button>
      </div>

      {/* Centralized Enterprise Authentication Card (Smooth Upward Viewport Shift on Focus) */}
      <div
        ref={cardRef}
        className={`max-w-md w-full mx-auto my-auto py-4 transition-all duration-300 ease-out transform ${
          showKeyboard
            ? '-translate-y-20 sm:-translate-y-28 md:-translate-y-32 scale-[0.98]'
            : 'translate-y-0 scale-100'
        }`}
      >
        <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-xl p-5 sm:p-7 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Clean Brand Header (Logo & Title Only) */}
          <div className="text-center select-none pt-1">
            <div className="flex flex-col items-center justify-center">
              <span className="font-display font-black text-3xl sm:text-4xl tracking-tight text-[#C8102E] leading-none">
                {SHORT_NAME}
              </span>
              <span className="text-xs sm:text-sm font-black tracking-widest text-[#EAB308] uppercase leading-none mt-1.5">
                {BRAND_TAGLINE}
              </span>
            </div>
          </div>

          {/* Error Alert Display */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Authentication Error:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Staff directory connection problem: shown explicitly instead of failing silently */}
          {staffDirectory.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-mono space-y-2">
              <div className="font-extrabold uppercase">Cannot load staff accounts from Supabase</div>
              <div className="break-words">{staffDirectory.message || 'Network or permission error.'}</div>
              <button
                type="button"
                onClick={() => refetchCloudCatalog()}
                disabled={isCloudSyncing}
                className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-60 text-white font-bold"
              >
                {isCloudSyncing ? 'Retrying...' : 'Retry connection'}
              </button>
            </div>
          )}

          {/* Unified Two-Field Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Field 1: Username / Staff ID */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-stone-700 uppercase font-mono mb-1.5"
              >
                Username / Staff ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={usernameInputRef}
                  id="login-username"
                  name="chikarro_user_no_autofill"
                  type="text"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  value={usernameInput}
                  onFocus={() => {
                    setFocusedField('username');
                    setShowKeyboard(true);
                  }}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter Username or Staff ID"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 border text-xs md:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition shadow-inner ${
                    focusedField === 'username' && showKeyboard
                      ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20'
                      : 'border-stone-200 focus:border-[#C8102E]'
                  }`}
                />
              </div>
            </div>

            {/* Field 2: Password / Access PIN */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-stone-700 uppercase font-mono mb-1.5"
              >
                Password / Access PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={passwordInputRef}
                  id="login-password"
                  name="chikarro_pin_no_autofill"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  value={passwordInput}
                  onFocus={() => {
                    setFocusedField('password');
                    setShowKeyboard(true);
                  }}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Password or Access PIN"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 border text-xs md:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition shadow-inner ${
                    focusedField === 'password' && showKeyboard
                      ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20'
                      : 'border-stone-200 focus:border-[#C8102E]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-[#C8102E] hover:bg-[#A50D25] disabled:opacity-50 text-white font-display font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] border-2 border-[#A50D25]"
            >
              <Lock className="w-4 h-4" />
              <span>SIGN IN TO TERMINAL</span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <div
        className={`max-w-md w-full mx-auto pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-3 text-xs font-mono text-stone-500 transition-opacity duration-200 ${
          showKeyboard ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div>{PRODUCT_NAME}</div>
        <div className="font-bold tracking-wider text-stone-700">
          {POWERED_BY}
        </div>
      </div>

      {/* ===========================================================================
          ON-SCREEN TOUCH VIRTUAL KEYBOARD (SEAMLESS DOCK & SMOOTH SLIDE-UP ANIMATION)
         =========================================================================== */}
      <div
        ref={keyboardRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out transform ${
          showKeyboard
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#FAF6F0] p-2 sm:p-3.5 max-w-3xl mx-auto relative select-none">
          {/* Subtle Top Indicator & Dismiss Pill */}
          <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-mono text-stone-500">
            <span className="font-bold tracking-wider uppercase text-stone-500 text-[10px]">
              Touch Terminal Virtual Keyboard
            </span>
            <button
              type="button"
              onClick={() => {
                playTerminalSound('tap');
                setShowKeyboard(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200/80 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-bold transition active:scale-95 text-[11px]"
              title="Dismiss Virtual Keyboard"
            >
              <X className="w-3 h-3" />
              <span>Hide Keyboard</span>
            </button>
          </div>

          {/* Clean Tactile Keys Layout */}
          <div className="space-y-1.5 pt-1">
            {/* Row 1: Numbers & Quick Symbols */}
            <div className="grid grid-cols-12 gap-1 sm:gap-1.5">
              {QWERTY_NUM_ROW.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 hover:border-amber-300 active:scale-95 active:bg-amber-100 font-mono font-bold text-sm sm:text-base text-[#1E293B] shadow-xs flex items-center justify-center transition-all"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Row 2: QWERTY Row 1 */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {QWERTY_ROW_1.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 hover:border-amber-300 active:scale-95 active:bg-amber-100 font-mono font-bold text-sm sm:text-base text-[#1E293B] shadow-xs flex items-center justify-center transition-all"
                >
                  {isCapsLock ? key.toUpperCase() : key.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Row 3: QWERTY Row 2 */}
            <div className="grid grid-cols-9 gap-1 sm:gap-1.5 px-3 sm:px-6">
              {QWERTY_ROW_2.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 hover:border-amber-300 active:scale-95 active:bg-amber-100 font-mono font-bold text-sm sm:text-base text-[#1E293B] shadow-xs flex items-center justify-center transition-all"
                >
                  {isCapsLock ? key.toUpperCase() : key.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Row 4: CapsLock, QWERTY Row 3, Backspace */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playTerminalSound('tap');
                  setIsCapsLock(!isCapsLock);
                }}
                className={`col-span-2 min-h-[42px] sm:min-h-[46px] rounded-xl border font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 shadow-xs ${
                  isCapsLock
                    ? 'bg-amber-500 border-amber-600 text-white'
                    : 'bg-stone-100 border-[#E8E1D5] text-stone-700 hover:bg-stone-200'
                }`}
              >
                {isCapsLock ? 'CAPS ON' : 'Caps'}
              </button>

              {QWERTY_ROW_3.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKeyPress(key)}
                  className="min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 hover:border-amber-300 active:scale-95 active:bg-amber-100 font-mono font-bold text-sm sm:text-base text-[#1E293B] shadow-xs flex items-center justify-center transition-all"
                >
                  {isCapsLock ? key.toUpperCase() : key.toLowerCase()}
                </button>
              ))}

              <button
                type="button"
                onClick={handleVirtualBackspace}
                className="min-h-[42px] sm:min-h-[46px] rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 active:scale-95 text-amber-900 font-mono font-bold text-sm shadow-xs flex items-center justify-center transition-all"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Row 5: Tab / Next Field, Spacebar, Dot, Sign In */}
            <div className="grid grid-cols-12 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleVirtualFieldSwitch}
                className="col-span-3 min-h-[42px] sm:min-h-[46px] rounded-xl bg-stone-100 border border-[#E8E1D5] hover:bg-stone-200 active:scale-95 font-mono font-bold text-xs text-stone-700 shadow-xs flex items-center justify-center gap-1 transition-all"
              >
                <span>Next Field ⇥</span>
              </button>

              <button
                type="button"
                onClick={() => handleVirtualKeyPress(' ')}
                className="col-span-5 min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 active:scale-95 font-mono font-bold text-xs text-stone-500 shadow-xs flex items-center justify-center transition-all"
              >
                Space
              </button>

              <button
                type="button"
                onClick={() => handleVirtualKeyPress('.')}
                className="col-span-1 min-h-[42px] sm:min-h-[46px] rounded-xl bg-white border border-[#E8E1D5] hover:bg-amber-50 active:scale-95 font-mono font-bold text-sm text-[#1E293B] shadow-xs flex items-center justify-center transition-all"
              >
                .
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="col-span-3 min-h-[42px] sm:min-h-[46px] rounded-xl bg-[#C8102E] hover:bg-[#A50D25] active:scale-95 text-white font-mono font-extrabold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1 transition-all"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
