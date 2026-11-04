'use client';

import { useState, useEffect } from 'react';
import { Globe, Settings, FileArchive, AlertCircle, CheckCircle2, ChevronRight, Loader2, Code, ShieldCheck, MessageCircle, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface TaskStatus {
 isFinished?: boolean;
 copiedFilesAmount?: number;
 errorText?: string;
 errorCode?: string;
 md5?: string;
}

export default function Home() {
 const [showWelcomePopup, setShowWelcomePopup] = useState(false);
 const [url, setUrl] = useState('');
 const [config, setConfig] = useState({
 renameAssets: true,
 saveStructure: true,
 alternativeAlgorithm: false,
 mobileVersion: false,
 });

 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [taskHash, setTaskHash] = useState<string | null>(null);
 const [status, setStatus] = useState<TaskStatus | null>(null);

 // Welcome Popup Logic
 useEffect(() => {
 const timer = setTimeout(() => {
 setShowWelcomePopup(true);
 }, 600);
 return () => clearTimeout(timer);
 }, []);

 // Polling logic
 useEffect(() => {
 let interval: NodeJS.Timeout;

 const checkStatus = async () => {
 if (!taskHash) return;

 try {
 const res = await fetch(`/api/clone/status?md5=${taskHash}`);
 if (!res.ok) {
 throw new Error('Gagal memeriksa status dari server.');
 }
 const data: TaskStatus = await res.json();

 if (data.errorText) {
 setError(data.errorText);
 setIsLoading(false);
 setTaskHash(null);
 return;
 }

 setStatus(data);

 // If finished, stop polling
 if (data.isFinished) {
 setIsLoading(false);
 // Keeping the hash to show download link!
 }
 } catch (err: any) {
 console.error("Polling error:", err);
 }
 };

 if (isLoading && taskHash) {
 interval = setInterval(checkStatus, 1500);
 }

 return () => {
 if (interval) clearInterval(interval);
 };
 }, [isLoading, taskHash]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!url) {
 setError("Silakan masukkan URL.");
 return;
 }

 if (!/^https:\/\//i.test(url)) {
 setError("URL harus dimulai dengan https://");
 return;
 }

 setError(null);
 setStatus(null);
 setTaskHash(null);
 setIsLoading(true);

 try {
 const res = await fetch('/api/clone/start', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 url,
 ...config
 }),
 });

 const data = await res.json();

 if (!res.ok || data.error) {
 throw new Error(data.error || 'Server menolak permintaan.');
 }

 if (!data?.md5) {
 throw new Error("Gagal menginisialisasi proses cloning. Hasil tidak mengenali Hash.");
 }

 // Start polling
 setTaskHash(data.md5);

 } catch (err: any) {
 setError(err.message || "Terdapat kesalahan yang tidak terduga.");
 setIsLoading(false);
 }
 };

 const handleConfigChange = (key: keyof typeof config) => {
 setConfig(prev => ({ ...prev, [key]: !prev[key] }));
 };

 return (
 <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
 {/* Navigation / Header */}
 <nav className="sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-xl border-b border-zinc-200">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
 <div className="flex items-center gap-3 font-bold tracking-tight shrink-0">
 <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-md overflow-hidden shrink-0 shadow-sm border border-zinc-200 bg-zinc-100 hidden sm:block">
 <Image
 src="https://picsum.photos/seed/webarchive/150/150"
 alt="WebArchiver Logo"
 fill
 className="object-cover"
 referrerPolicy="no-referrer"
 />
 </div>
 <span className="truncate text-base sm:text-lg">WebArchiver</span>
 </div>
 <div className="text-[11px] sm:text-sm font-medium text-zinc-500 flex flex-col sm:flex-row items-end sm:items-center sm:gap-2 shrink-0">
 <div className="flex items-center gap-1.5">
 <Code className="w-4 h-4 hidden sm:block" />
 <span className="hidden sm:inline">Developer:</span>
 </div>
 <span className="text-zinc-900 font-bold tracking-tight whitespace-nowrap"></span>
 </div>
 </div>
 </nav>

 <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

 {/* Left Column: Output & Controls */}
 <div className="lg:col-span-7 space-y-8">

 <div className="space-y-4">
 <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900">
 Ubah Website Menjadi <br className="hidden md:block"/>
 <span className="text-indigo-600">Arsip ZIP Instan.</span>
 </h1>
 <p className="text-lg text-zinc-600 max-w-xl leading-relaxed">
 Utilitas kuat tingkat profesional untuk mengekstrak, mengkloning, dan mengompres seluruh halaman web menjadi paket ZIP yang dapat diunduh.
 </p>
 </div>

 <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-200">
 <form onSubmit={handleSubmit} className="space-y-6">

 <div className="space-y-2">
 <label htmlFor="url" className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
 <Globe className="w-4 h-4 text-zinc-400" />
 Target URL
 </label>
 <div className="relative">
 <input
 id="url"
 type="url"
 value={url}
 onChange={(e) => setUrl(e.target.value)}
 placeholder="https://example.com"
 disabled={isLoading}
 className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:opacity-50"
 required
 />
 </div>
 </div>

 <div className="space-y-3">
 <label className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
 <Settings className="w-4 h-4 text-zinc-400" />
 Konfigurasi Lanjutan
 </label>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {[
 { key: 'renameAssets', label: 'Rename Assets', desc: 'Atur ulang nama file aset' },
 { key: 'saveStructure', label: 'Save Structure', desc: 'Pertahankan struktur folder' },
 { key: 'alternativeAlgorithm', label: 'Alt Algorithm', desc: 'Gunakan mode kloning lambat' },
 { key: 'mobileVersion', label: 'Mobile Version', desc: 'Simulasi viewport mobile' }
 ].map((item) => (
 <label
 key={item.key}
 className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${config[item.key as keyof typeof config] ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
 >
 <div className="pt-0.5">
 <input
 type="checkbox"
 disabled={isLoading}
 checked={config[item.key as keyof typeof config]}
 onChange={() => handleConfigChange(item.key as keyof typeof config)}
 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600 border-zinc-300 disabled:opacity-50"
 />
 </div>
 <div>
 <div className={`text-sm font-medium ${config[item.key as keyof typeof config] ? 'text-indigo-900' : 'text-zinc-900'}`}>
 {item.label}
 </div>
 <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
 </div>
 </label>
 ))}
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {isLoading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
 Sedang Memproses...
 </>
 ) : (
 <>
 Mulai Proses Kloning
 <ChevronRight className="w-4 h-4 opacity-70" />
 </>
 )}
 </button>
 </form>
 </div>

 <AnimatePresence mode="wait">
 {error && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm"
 >
 <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
 <div className="font-medium">{error}</div>
 </motion.div>
 )}

 {(isLoading || status?.isFinished) && taskHash && !error && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-6"
 >
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-zinc-900">Status Task</h3>
 <p className="text-xs text-zinc-500 font-mono mt-1">ID: {taskHash.substring(0, 12)}...</p>
 </div>
 {status?.isFinished ? (
 <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 Selesai
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 Memproses
 </span>
 )}
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-zinc-600">File yang dikloning:</span>
 <span className="font-medium text-zinc-900">{status?.copiedFilesAmount || 0} file</span>
 </div>
 {/* Fake Progress bar for visual feedback since we only know file count, not total expected */}
 <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden relative">
 <div className={`absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-500 ${status?.isFinished ? 'w-full' : 'w-2/3 animate-pulse'}`}></div>
 </div>
 </div>

 {status?.isFinished && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="pt-4 border-t border-zinc-100"
 >
 <a
 href={`https://copier.saveweb2zip.com/api/downloadArchive/${taskHash}`}
 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20"
 >
 <FileArchive className="w-4 h-4" />
 Unduh Archive ZIP
 </a>
 <p className="text-center text-xs text-zinc-500 mt-3">
 Unduhan ini akan diselesaikan secara otomatis melalui browser Anda.
 </p>
 </motion.div>
 )}
 </motion.div>
 )}
 </AnimatePresence>

 </div>

 {/* Right Column: Documentation */}
 <div className="lg:col-span-5 space-y-6">
 <div className="bg-zinc-900 text-zinc-50 p-8 rounded-3xl shadow-xl">
 <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
 <ShieldCheck className="w-5 h-5 text-indigo-400" />
 Detail Informasi Web & Kegunaan
 </h2>
 <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
 <p>
 <strong className="text-zinc-200">Web to ZIP Archiver</strong> adalah sebuah platform serius dan sangat responsif yang dibangun
 khusus untuk mengonversi situs web publik apa pun menjadi format file arsip tunggal (.zip).
 </p>
 <ul className="space-y-3 pt-2">
 <li className="flex items-start gap-2">
 <div className="bg-zinc-800 p-1 rounded mt-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400"/></div>
 <span><strong>Arsip Offline:</strong> Berguna bagi Anda yang ingin membaca atau meninjau sebuah halaman situs tanpa konektivitas internet aktif.</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="bg-zinc-800 p-1 rounded mt-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400"/></div>
 <span><strong>Audit Struktur Kode:</strong> Sangat bermanfaat bagi web developer yang ingin mempelajari bagaimana struktur aset, implementasi HTML/CSS/JS dari publik URL target.</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="bg-zinc-800 p-1 rounded mt-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400"/></div>
 <span><strong>Pemulihan & Backup Sementara:</strong> Membantu menyelamatkan visualisasi halaman publik yang sedang live.</span>
 </li>
 </ul>
 <div className="mt-6 pt-6 border-t border-zinc-800">
 <h3 className="text-zinc-200 font-semibold mb-3">Cara Penggunaan:</h3>
 <ol className="list-decimal list-inside space-y-2 ml-1">
 <li>Masukkan <strong>URL Target</strong> pada form (Ketik URL penuh beserta awalan <code className="bg-zinc-800 px-1 py-0.5 rounded text-indigo-300">https://</code>).</li>
 <li>Sesuaikan panel <strong>Konfigurasi Lanjutan</strong> sesuai dengan spesifikasi yang dibutuhkan target (biarkan default jika ragu).</li>
 <li>Tekan tombol <strong>"Mulai Proses Kloning"</strong>. Sistem akan mengambil aset dan merangkai arsip di backend cloud.</li>
 <li>Tunggu progress bar selesai berjalan, pantau jumlah file kloning dalam interface pelacak interaktif yang muncul.</li>
 <li>Setelah sukses, tekan tombol <strong>"Unduh Archive ZIP"</strong> untuk mendapatkan hasil.</li>
 </ol>
 </div>
 </div>

 <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
 <span className="text-xs text-zinc-500">Versi 1.0.0-stable</span>
 <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">@</span>
 </div>
 </div>
 </div>
 </div>

 {/* Welcome Popup */}
 <AnimatePresence>
 {showWelcomePopup && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
 onClick={() => setShowWelcomePopup(false)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 onClick={(e) => e.stopPropagation()}
 className="bg-white rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden border border-zinc-200"
 >
 <div className="p-6 sm:p-8">
 <div className="flex justify-between items-start mb-4">
 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
 <MessageCircle className="w-6 h-6 text-emerald-600" />
 </div>
 <button
 onClick={() => setShowWelcomePopup(false)}
 className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-zinc-100/50 hover:bg-zinc-100 rounded-full"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <h3 className="text-xl font-bold text-zinc-900 mb-2">Selamat Datang!</h3>
 <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
 Terima kasih telah menggunakan Web to ZIP Archiver. Untuk update terbaru, tips, dan diskusi menarik, mari bergabung dengan saluran WhatsApp kami.
 </p>

 <a
 href="https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L"
 target="_blank"
 rel="noopener noreferrer"
 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mb-6 shadow-sm shadow-emerald-600/20"
 >
 Join Saluran WhatsApp
 </a>

 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
 <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
 <div className="text-zinc-800 text-xs leading-relaxed">
 <span className="font-bold">Disclaimer:</span> Layanan web ini disediakan <strong className="text-amber-700">100% GRATIS</strong> dan tidak diperjualbelikan.
 </div>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </main>
 );
}
