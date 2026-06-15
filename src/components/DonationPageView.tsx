import { useState, useEffect, FormEvent } from 'react';
import { Heart, Landmark, Check, ArrowLeft, MessageSquare, Award, Volume2, Sparkles, AlertCircle, Copy, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// CRC16 Helper for PromptPay
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// PromptPay QR Generator
function generatePromptPayQR(phoneNumber: string, amount?: number): string {
  let sanitized = phoneNumber.replace(/[^0-9]/g, '');
  
  if (sanitized.startsWith('0') && sanitized.length === 10) {
    sanitized = '0066' + sanitized.substring(1);
  } else {
    sanitized = sanitized.padStart(13, '0');
  }

  const aid = "0016A000000677010111";
  const phoneTag = "01" + sanitized.length.toString().padStart(2, '0') + sanitized;
  const merchantInfo = aid + phoneTag;
  
  const tag29 = "29" + merchantInfo.length.toString().padStart(2, '0') + merchantInfo;
  const tag53 = "5303764"; // THB Currency
  
  let tag54 = "";
  if (amount && amount > 0) {
    const amtStr = amount.toFixed(2);
    tag54 = "54" + amtStr.length.toString().padStart(2, '0') + amtStr;
  }
  
  const tag58 = "5802TH";
  const prefix = "000201010212" + tag29 + tag53 + tag54 + tag58 + "6304";
  
  return prefix + crc16(prefix);
}

export default function DonationPageView() {
  const [streamer, setStreamer] = useState({
    phone: "0821062891",
    walletPhone: "0821062891",
    bankName: "กสิกรไทย (KBANK)",
    bankAccount: "738-2-19284-1",
    bankOwner: "ลันตา สตรีมเมอร์",
    name: "ลันตา สตรีมเมอร์",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
    bio: "สตรีมเมอร์สัญชาติไทย ยินดีต้อนรับทุกคนเข้าสู่คลังสนับสนุน OBS!"
  });

  const [donorName, setDonorName] = useState('');
  const [donateAmount, setDonateAmount] = useState('50');
  const [donorComment, setDonorComment] = useState('');
  const [step, setStep] = useState<'form' | 'qr' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'bank' | 'wallet'>('promptpay');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current streamer state from backend profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/streamer/profile');
        if (res.ok) {
          const data = await res.json();
          setStreamer(data);
        }
      } catch (err) {
        console.warn("Failed to load streamer profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert("กรุณากรอกชื่อผู้ส่งสนับสนุนเพื่อแจ้งเตือนหน้าจอ");
      return;
    }
    const amt = Number(donateAmount);
    if (!amt || amt <= 0) {
      alert("กรุณาเลือกหรือระบุยอดเงินที่ต้องการส่งสนับสนุนอย่างน้อย ฿1");
      return;
    }
    setStep('qr');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Post alert payment notification directly to streamer's live alerts queue!
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donate_alert',
          nickname: donorName.trim(),
          comment: donorComment.trim() || 'ฉันสนับสนุนและส่งความผูกพันให้คุณครับ!',
          amount: Number(donateAmount),
          profilePictureUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(donorName)}`
        })
      });

      if (res.ok) {
        // Play alert audio clip locally on viewer page too for ultra feedback satisfying vibe!
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
          audio.volume = 0.45;
          audio.play();
        } catch { }
        
        setStep('success');
      } else {
        alert("ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDonationPage = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#07070a] text-zinc-100 flex flex-col justify-between font-sans selection:bg-[#ff007f]/30">
      
      {/* Decorative Blur Background bubbles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md bg-[#0c0c14] border border-zinc-900 rounded-[28px] shadow-2xl overflow-hidden self-center my-auto">
          
          {/* Cover image area */}
          <div className="relative h-28 w-full bg-zinc-950 overflow-hidden">
            <img 
              src={streamer.coverImage} 
              alt="Streamer cover" 
              className="w-full h-full object-cover filter brightness-[0.6] blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] to-transparent" />
            <div className="absolute bottom-3 left-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/60 overflow-hidden bg-zinc-900 shadow-md">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(streamer.name)}`}
                  alt={streamer.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-1.5 drop-shadow">
                  {streamer.name} 
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" title="Live Streamer ready"></span>
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium drop-shadow-sm">{streamer.bio}</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={handleNextStep}
                className="p-6 space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">
                    ชื่อผู้ส่งสนับสนุน / Nickname <span className="text-[#ff007f] font-mono">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength={24}
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    placeholder="ใส่ชื่อของคุณที่จะแสดงบนหน้าจอสตรีม..."
                    className="w-full bg-[#12121e] border border-zinc-900 hover:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">
                    จำนวนเงินที่จะโดเนท / Amount (THB) <span className="text-[#ff007f] font-mono">*</span>
                  </label>
                  
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={donateAmount}
                      onChange={e => setDonateAmount(e.target.value)}
                      className="w-full bg-[#12121e] border border-zinc-900 rounded-xl pl-10 pr-4 py-3 font-mono font-black text-base text-cyan-400 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <div className="absolute left-4 top-3 text-zinc-500 font-bold select-none text-base">฿</div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {['20', '50', '100', '300', '1000'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setDonateAmount(val)}
                        className={`py-1.5 rounded-lg border text-center text-[10px] font-mono transition-all h-8 flex items-center justify-center cursor-pointer ${
                          donateAmount === val 
                            ? 'bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-white font-extrabold border-indigo-500/60 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                            : 'bg-[#10101a] border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                        }`}
                      >
                        ฿{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELECT DONATION PAYMENT CHANNEL (PromptPay / Bank / TrueWallet) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block">
                    ช่องทางชำระเงินสนับสนุน / Payment Method <span className="text-[#ff007f] font-mono">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'promptpay', label: '📱 PromptPay', desc: 'สร้าง QR Code' },
                      { id: 'bank', label: '🏦 ธนาคาร', desc: 'โอนเลขบัญชี' },
                      { id: 'wallet', label: '💳 TrueWallet', desc: 'ทรูมันนี่วอลเล็ท' }
                    ].map(method => (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          paymentMethod === method.id 
                            ? 'bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border-indigo-500/60 text-white font-extrabold shadow-[0_0_12px_rgba(139,92,246,0.15)]' 
                            : 'bg-[#10101b] border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-805'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-white/90">{method.label}</span>
                        <span className="text-[8px] text-zinc-500 mt-0.5 font-medium">{method.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono block flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-indigo-400" /> ข้อความติดตลกโดเนท / Tip Message
                    </label>
                    <span className="text-[9px] font-mono text-zinc-500">สูงสุด 120 ตัวอักษร</span>
                  </div>
                  <textarea 
                    maxLength={120}
                    value={donorComment}
                    onChange={e => setDonorComment(e.target.value)}
                    placeholder="ข้อความที่จะใช้เสียงสิริ (TTS) อ่านออกลำโพงสดๆ ทันที..."
                    rows={3}
                    className="w-full bg-[#12121e] border border-zinc-900 hover:border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans resize-none"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-1.5 select-none hover:-translate-y-[1px] transition-all cursor-pointer active:scale-98"
                  >
                    <span>ดำเนินการต่อ เพื่อแสดงข้อมูลช่องทางการโอนเงิน</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'qr' && (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-6 flex flex-col items-center space-y-5"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep('form')}
                  className="self-start text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95 py-1 px-2.5 rounded-lg border border-zinc-900 bg-[#10101b]"
                >
                  <ArrowLeft className="w-3 h-3" /> ย้อนกลับไปแก้ไขฟอร์ม
                </button>

                {paymentMethod === 'promptpay' && (
                  /* Highly-designed luxury dynamic promptpay card */
                  <div className="w-full max-w-[250px] bg-white p-5 rounded-3xl border border-zinc-200 shadow-xl flex flex-col items-center select-none relative overflow-hidden text-zinc-950">
                    <div className="flex justify-between w-full items-center mb-2.5 text-[9.5px] text-[#002f5a] font-extrabold font-mono border-b border-sky-100 pb-1.5">
                      <span>PROMPTPAY DECAL</span>
                      <span className="flex items-center gap-1 text-[8px] bg-sky-100 text-sky-750 px-1.5 py-0.2 rounded font-sans shrink-0 uppercase tracking-wide">
                        ⚡ Dynamic Realtime
                      </span>
                    </div>

                    {/* High Quality Real-Scanning QR server generator via standard dynamic EMV payload */}
                    <div className="w-[190px] h-[190px] bg-sky-50/50 rounded-2xl p-2.5 flex items-center justify-center border border-sky-100">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatePromptPayQR(streamer.phone, Number(donateAmount)))}`} 
                        alt="Thai PromptPay dynamic QR" 
                        className="w-full h-full object-contain filter contrast-[1.1]"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Amount Badge */}
                    <div className="mt-3.5 text-center w-full">
                      <span className="text-[9.5px] text-zinc-400 font-extrabold uppercase tracking-wide block leading-none">สรุปรายการส่งสนับสนุนตรง</span>
                      <span className="text-sm font-black text-[#002f5a] font-mono block mt-2 bg-gradient-to-r from-sky-50 to-blue-50 py-1.5 rounded-xl border border-sky-100/60 shadow-sm">
                        ฿{Number(donateAmount).toLocaleString()} THB
                      </span>
                      
                      <div className="mt-3 flex items-center justify-center gap-1.5 bg-zinc-50 border border-zinc-150 py-1 px-2.5 rounded-lg">
                        <span className="text-[9px] font-bold text-zinc-650 truncate font-mono">
                          ID: {streamer.phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(streamer.phone);
                            setCopiedField('phone');
                            setTimeout(() => setCopiedField(null), 1800);
                          }}
                          className="p-1 hover:bg-zinc-200 rounded transition duration-200"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  /* Elegant Bank transfer visual card */
                  <div className="w-full bg-[#11111e] border border-indigo-505/30 p-5 rounded-2xl shadow-xl space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">รายละเอียดบัญชีธนาคาร</h4>
                      </div>
                      <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-500/30 py-0.5 px-2 rounded-full font-mono uppercase">Bank Acc</span>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-extrabold font-mono uppercase block">เป้าหมายรับยอดโดเนท</span>
                        <p className="text-sm font-bold text-white mt-0.5">{streamer.bankName}</p>
                      </div>

                      <div className="bg-[#09090d] border border-[#1b1b2f] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-zinc-500 font-bold uppercase block">หมายเลขบัญชีธนาคาร</span>
                          <span className="text-sm font-black font-mono text-cyan-400">{streamer.bankAccount}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(streamer.bankAccount);
                            setCopiedField('bankAccount');
                            setTimeout(() => setCopiedField(null), 1800);
                          }}
                          className={`p-2 rounded-xl border ${
                            copiedField === 'bankAccount' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                              : 'bg-[#12121e] border-[#1b1b2e] text-zinc-400 hover:text-white'
                          } transition-all`}
                        >
                          {copiedField === 'bankAccount' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-[#09090d] border border-[#1b1b2f] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-zinc-500 font-bold uppercase block">ชื่อบัญชีผู้รับยอด / Holder Name</span>
                          <span className="text-xs font-bold text-white">{streamer.bankOwner}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(streamer.bankOwner);
                            setCopiedField('bankOwner');
                            setTimeout(() => setCopiedField(null), 1800);
                          }}
                          className={`p-2 rounded-xl border ${
                            copiedField === 'bankOwner' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                              : 'bg-[#12121e] border-[#1b1b2e] text-zinc-400 hover:text-white'
                          } transition-all`}
                        >
                          {copiedField === 'bankOwner' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-gradient-to-r from-cyan-950/10 to-indigo-950/10 border border-cyan-500/10 p-2 rounded-xl text-center">
                        <span className="text-[8px] text-zinc-500 block uppercase font-mono">ยอดสนับสนุนที่เลือกระบุ</span>
                        <span className="text-sm font-black text-white font-mono bg-[#09090e] px-3 py-1 rounded border border-zinc-900/80 inline-block mt-1">
                          ฿{Number(donateAmount).toLocaleString()} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  /* Hot TrueWallet solar design card */
                  <div className="w-full bg-[#1c1209] border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">💳</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">บัญชี TrueMoney Wallet</h4>
                      </div>
                      <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-500/30 py-0.5 px-2 rounded-full font-mono uppercase">Wallet</span>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div className="bg-[#0f0a07] border border-amber-900/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-amber-500 font-extrabold font-mono uppercase block">เบอร์วอลเล็ทเป้าหมาย / Wallet Phone</span>
                          <span className="text-sm font-black font-mono text-amber-400">
                            {streamer.walletPhone || streamer.phone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(streamer.walletPhone || streamer.phone);
                            setCopiedField('walletPhone');
                            setTimeout(() => setCopiedField(null), 1800);
                          }}
                          className={`p-2 rounded-xl border ${
                            copiedField === 'walletPhone' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                              : 'bg-zinc-900 border-transparent hover:border-[#382618] text-zinc-400 hover:text-white'
                          } transition-all`}
                        >
                          {copiedField === 'walletPhone' ? (
                            <Check className="w-3.5 h-3.5 animate-bounce" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-[#0f0a07] border border-amber-900/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-zinc-550 font-extrabold uppercase font-mono block">ชื่อผู้รับโอนวอลเล็ท / Holder Name</span>
                          <span className="text-xs font-bold text-white">{streamer.bankOwner}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(streamer.bankOwner);
                            setCopiedField('walletOwner');
                            setTimeout(() => setCopiedField(null), 1800);
                          }}
                          className={`p-2 rounded-xl border ${
                            copiedField === 'walletOwner' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                              : 'bg-zinc-900 border-transparent hover:border-[#382618] text-zinc-400 hover:text-white'
                          } transition-all`}
                        >
                          {copiedField === 'walletOwner' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-gradient-to-r from-amber-950/10 to-orange-950/10 border border-amber-500/10 p-2 rounded-xl text-center">
                        <span className="text-[8px] text-zinc-500 block uppercase font-mono">ยอดสนับสนุนที่เลือกระบุ</span>
                        <span className="text-sm font-black text-white font-mono bg-[#09090e] px-3 py-1 rounded inline-block mt-1">
                          ฿{Number(donateAmount).toLocaleString()} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full text-center space-y-1 bg-[#10101b] border border-zinc-900 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase font-mono flex items-center justify-center gap-1">
                    <Landmark className="w-3 h-3 text-indigo-400" /> คำแนะนำการโอนสนับสนุน
                  </span>
                  <p className="text-[10px] text-zinc-450 leading-relaxed text-left">
                    {paymentMethod === 'promptpay' && "สแกนโอนผ่านระบบพร้อมเพย์ด้วยแอปธนาคารใดก็ได้ ยอดเงินจะถูกโอนเข้าบัญชีส่วนตัวของสตรีมเมอร์โดยตรงทันที เมื่อโอนเสร็จโปรดกดคลิกปุ่มยืนยันการโอนเงินด้านล่าง!"}
                    {paymentMethod === 'bank' && "โอนเงินผ่านแอปพลิเคชันธนาคารของคุณ ด้วยการสแกนหรือคัดลอกเลขบัญชีที่แสดงข้างต้น ทันทีเมื่อโอนเรียบร้อยโปรดคลิกยืนยันการโอนด้านล่าง!"}
                    {paymentMethod === 'wallet' && "เปิดแอป TrueMoney Wallet และทำการโอนเงินไปยังเบอร์วอลเล็ทด้านบน เมื่อดำเนินโอนเงินเรียบร้อยแล้วโปรดคลิกยืนยันด้านล่าง!"}
                  </p>
                </div>

                {/* Confirmation Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmPayment}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-850 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 select-none"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>โอนเสร็จแล้ว! ส่งการแจ้งเตือนขึ้นหน้าจอดีเจดีไซเนอร์</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 text-center space-y-5"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-450 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/10">
                  <Check className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white">ส่งการสนับสนุนเรียบร้อยแล้ว! 🎉</h3>
                  <p className="text-[11px] text-zinc-455 font-medium leading-relaxed">
                    เสียงและภาพแจ้งเตือนถูกส่งตรงขึ้นหน้าจอไลฟ์สดสตรีม พร้อมเสียงสิริอ่านข้อความของคุณแล้ว ขอบพระคุณสำหรับผู้สนับสนุนด้วยความอบอุ่นจิตใจ
                  </p>
                </div>

                {/* Show Details badge summary */}
                <div className="bg-[#10101b] border border-zinc-900 p-4 rounded-xl text-left space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-1.5 mb-1.5">
                    <span className="text-zinc-500 font-bold uppercase font-mono">สรุปยอดสนับสนุน</span>
                    <span className="text-cyan-400 font-mono font-bold">฿{Number(donateAmount).toLocaleString()} บาท</span>
                  </div>
                  <div className="text-[10px] text-zinc-300">
                    <span className="font-mono text-zinc-500 font-bold uppercase block text-[8px]">ชื่อของคุณ</span>
                    <span className="font-black">@{donorName}</span>
                  </div>
                  <div className="text-[10px] text-zinc-300">
                    <span className="font-mono text-zinc-500 font-bold uppercase block text-[8px]">ข้อความ</span>
                    <p className="italic text-zinc-400">"{donorComment || 'ไม่มีข้อความ'}"</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('form');
                    setDonorName('');
                    setDonorComment('');
                  }}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-xl border border-zinc-800 cursor-pointer transition-all active:scale-95"
                >
                  ร่วมสนับสนุนใหม่อีกครั้ง
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card action footer: Share Link center */}
          <div className="p-4 bg-[#0a0a0f] border-t border-zinc-900 flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 select-none font-medium">แชร์ลิงก์นี้ให้ผู้ชมโอนขึ้นหน้าจอไลฟ์สด</span>
            <button
              onClick={handleCopyDonationPage}
              className={`py-1 px-2.5 rounded flex items-center gap-1 font-bold tracking-wider font-sans uppercase transition-all border shrink-0 cursor-pointer text-[9px] ${
                copiedLink 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/20' 
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border-zinc-850'
              }`}
            >
              {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

        </div>
      </main>

      {/* Footer credits block adhering to humbler anti-ai slop guidelines */}
      <footer className="p-4 text-center text-[9px] font-mono text-zinc-700 tracking-wider uppercase select-none relative z-10 border-t border-zinc-950 bg-[#06060a]">
        Thai PromptPay Decal OBS Alerts Stream Platform · Live Integrated Realtime Web Interface
      </footer>

    </div>
  );
}
