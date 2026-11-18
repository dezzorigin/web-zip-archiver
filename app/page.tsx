'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Settings, FileArchive, AlertCircle, CheckCircle2, ChevronRight,
  Loader2, ShieldCheck, Github, FolderArchive, FileCode2, Image as ImageIcon,
  Folder, ArrowDownToLine, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface TaskStatus {
  isFinished?: boolean;
  copiedFilesAmount?: number;
  errorText?: string;
  errorCode?: string;
  md5?: string;
}

const CONFIG_OPTIONS = [
  { key: 'renameAssets', label: 'Rename Assets', desc: 'Atur ulang nama file aset' },
  { key: 'saveStructure', label: 'Save Structure', desc: 'Pertahankan struktur folder' },
  { key: 'alternativeAlgorithm', label: 'Alt Algorithm', desc: 'Gunakan mode kloning lambat' },
  { key: 'mobileVersion', label: 'Mobile Version', desc: 'Simulasi viewport mobile' },
] as const;

type ConfigKey = (typeof CONFIG_OPTIONS)[number]['key'];

const FEATURES = [
  {
    icon: FolderArchive,
    title: 'Arsip Offline',
    desc: 'Baca atau tinjau sebuah halaman situs tanpa konektivitas internet aktif — seluruh halaman tersimpan dalam satu file ZIP.',
  },
  {
    icon: FileCode2,
    title: 'Audit Struktur Kode',
    desc: 'Pelajari struktur aset dan implementasi HTML/CSS/JS dari URL publik target. Berguna bagi web developer yang ingin memahami cara sebuah situs dibangun.',
  },
  {
    icon: ShieldCheck,
    title: 'Backup & Pemulihan',
    desc: 'Selamatkan visualisasi halaman publik yang sedang live sebagai cadangan sementara, sebelum halaman itu berubah atau hilang.',
  },
];

const STEPS = [
  { n: '1', title: 'Masukkan URL Target', desc: 'Ketik URL penuh beserta awalan https:// pada form di atas.' },
  { n: '2', title: 'Sesuaikan Konfigurasi', desc: 'Atur panel Konfigurasi Lanjutan sesuai kebutuhan target — biarkan default jika ragu.' },
  { n: '3', title: 'Mulai Proses Kloning', desc: 'Tekan tombol "Mulai Proses Kloning". Sistem mengambil aset dan merangkai arsip di backend.' },
  { n: '4', title: 'Pantau Progress', desc: 'Pantau jumlah file yang berhasil dikloning pada pelacak status yang muncul di bawah form.' },
  { n: '5', title: 'Unduh Archive ZIP', desc: 'Setelah selesai, tekan "Unduh Archive ZIP" untuk mendapatkan hasilnya.' },
];

const SAMPLE_FILES = [
  { icon: FileCode2, name: 'index.html', meta: '12,4 KB' },
  { icon: FileCode2, name: 'assets/style.css', meta: '8,1 KB' },
  { icon: FileCode2, name: 'assets/app.js', meta: '21,7 KB' },
  { icon: ImageIcon, name: 'images/logo.svg', meta: '3,2 KB' },
  { icon: Folder, name: 'images/', meta: '14 file' },
];

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-indigo-600" />
      <path d="M9 12h14M9 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8M9 12l2-4h10l2 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 15v4M14 17l2 2 2-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<Record<ConfigKey, boolean>>({
    renameAssets: true,
    saveStructure: true,
    alternativeAlgorithm: false,
    mobileVersion: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskHash, setTaskHash] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);

  // Polling status task yang sedang berjalan.
  useEffect(() => {
    if (!isLoading || !taskHash) return;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/clone/status?md5=${taskHash}`);
        if (!res.ok) throw new Error('Gagal memeriksa status dari server.');
        const data: TaskStatus = await res.json();

        if (data.errorText) {
          setError(data.errorText);
          setIsLoading(false);
          setTaskHash(null);
          return;
        }
        setStatus(data);
        if (data.isFinished) setIsLoading(false);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };
    const interval = setInterval(checkStatus, 1500);
    return () => clearInterval(interval);
  }, [isLoading, taskHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Silakan masukkan URL.');
      return;
    }
    if (!/^https:\/\//i.test(url)) {
      setError('URL harus dimulai dengan https://');
      return;
    }

    setError(null);
    setStatus(null);
    setTaskHash(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/clone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...config }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server menolak permintaan.');
      }
      if (!data?.md5) {
        throw new Error('Gagal menginisialisasi proses cloning. Hasil tidak mengenali Hash.');
      }
      setTaskHash(data.md5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terdapat kesalahan yang tidak terduga.');
      setIsLoading(false);
    }
  };

  const toggleConfig = (key: ConfigKey) =>
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#atas" className="flex items-center gap-2.5 font-bold tracking-tight shrink-0">
            <LogoMark className="w-8 h-8" />
            <span className="text-base sm:text-lg">Web ZIP Archiver</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#fitur" className="hidden md:inline text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hidden md:inline text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Cara Kerja</a>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gratis
            </span>
            <a
              href="https://github.com/dezzorigin/web-zip-archiver"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lihat kode sumber di GitHub"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      <div id="atas" className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-200">
              <FileArchive className="w-3.5 h-3.5" />
              Gratis · Tanpa akun · Tanpa instalasi
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-[1.05]">
              Ubah Website Menjadi <br className="hidden md:block" />
              <span className="text-indigo-600">Arsip ZIP Instan.</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-xl leading-relaxed">
              Utilitas untuk mengekstrak, mengkloning, dan mengompres seluruh halaman web
              menjadi satu paket ZIP yang dapat diunduh — lengkap dengan aset dan struktur foldernya.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#arsipkan"
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-5 py-3 rounded-xl transition-all"
              >
                Mulai Mengarsipkan
                <ChevronRight className="w-4 h-4 opacity-70" />
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 font-medium px-5 py-3 rounded-xl border border-zinc-200 transition-all"
              >
                Lihat Cara Kerja
              </a>
            </div>
            <p className="text-xs text-zinc-500">
              Hanya situs publik (https://) yang bisa diarsipkan. Arsip dibuat oleh layanan
              saveweb2zip.com — file ZIP diunduh dari server mereka.
            </p>
          </div>

          {/* Preview produk: contoh isi arsip */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <span className="w-3 h-3 rounded-full bg-zinc-300" />
                <span className="w-3 h-3 rounded-full bg-zinc-300" />
                <span className="w-3 h-3 rounded-full bg-zinc-300" />
                <span className="ml-2 text-xs font-mono text-zinc-500 truncate">example.com.zip</span>
                <span className="ml-auto text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">Contoh isi arsip</span>
              </div>
              <ul className="divide-y divide-zinc-100">
                {SAMPLE_FILES.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 px-4 py-3">
                    <f.icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-mono text-zinc-800 truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-zinc-500 shrink-0">{f.meta}</span>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>5 entri · struktur folder dipertahankan</span>
                <span className="font-medium text-zinc-700">.zip</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tool: form arsip */}
        <section id="arsipkan" className="scroll-mt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      Target URL
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      disabled={isLoading}
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:opacity-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setUrl('https://example.com')}
                      disabled={isLoading}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                    >
                      Coba dengan example.com →
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-zinc-400" />
                      Konfigurasi Lanjutan
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {CONFIG_OPTIONS.map((item) => (
                        <label
                          key={item.key}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                            config[item.key]
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                          )}
                        >
                          <input
                            type="checkbox"
                            disabled={isLoading}
                            checked={config[item.key]}
                            onChange={() => toggleConfig(item.key)}
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600 border-zinc-300 disabled:opacity-50"
                          />
                          <span>
                            <span className={cn('block text-sm font-medium', config[item.key] ? 'text-indigo-900' : 'text-zinc-900')}>
                              {item.label}
                            </span>
                            <span className="block text-xs text-zinc-500 mt-0.5">{item.desc}</span>
                          </span>
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
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm"
                    role="alert"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="font-medium">{error}</div>
                  </motion.div>
                )}

                {(isLoading || status?.isFinished) && taskHash && !error && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-6"
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Status Task</h3>
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
                        <span className="font-medium">{status?.copiedFilesAmount || 0} file</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden relative">
                        <div
                          className={cn(
                            'absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-500',
                            status?.isFinished ? 'w-full' : 'w-2/3 animate-pulse',
                          )}
                        />
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
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                          Unduh Archive ZIP
                        </a>
                        <p className="text-center text-xs text-zinc-500 mt-3">
                          Unduhan akan diselesaikan secara otomatis melalui browser Anda.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Kolom kanan: info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-zinc-900 text-zinc-50 p-8 rounded-3xl shadow-xl">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Detail Informasi Web &amp; Kegunaan
                </h2>
                <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                  <p>
                    <strong className="text-zinc-200">Web to ZIP Archiver</strong> adalah
                    platform yang dibangun khusus untuk mengonversi situs web publik apa pun
                    menjadi format file arsip tunggal (.zip).
                  </p>
                  <ul className="space-y-3 pt-2">
                    {FEATURES.map((f) => (
                      <li key={f.title} className="flex items-start gap-2">
                        <div className="bg-zinc-800 p-1 rounded mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span>
                          <strong className="text-zinc-200">{f.title}:</strong> {f.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Versi 1.0.0</span>
                  <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">MIT</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 items-start">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-700 leading-relaxed">
                  <strong>Catatan:</strong> layanan ini disediakan 100% gratis. Arsip hanya
                  bisa dibuat dari situs publik yang bisa diakses tanpa login, dan hasilnya
                  disimpan sementara di server penyedia (saveweb2zip.com) — unduh segera
                  setelah selesai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fitur */}
        <section id="fitur" className="scroll-mt-24 py-12 border-t border-zinc-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Kenapa mengarsipkan website?</h2>
          <p className="text-zinc-600 mt-2 max-w-2xl">Tiga kegunaan utama — dari membaca offline sampai mempelajari cara sebuah situs dibangun.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-24 py-12 border-t border-zinc-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cara Penggunaan</h2>
          <p className="text-zinc-600 mt-2 max-w-2xl">Lima langkah dari URL sampai file ZIP di perangkat Anda.</p>
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold">{s.n}</span>
                <h3 className="font-semibold text-sm mt-4">{s.title}</h3>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Footer */}
        <footer className="py-10 border-t border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2.5">
            <LogoMark className="w-6 h-6" />
            <span className="font-semibold text-zinc-900">Web ZIP Archiver</span>
            <span>· Lisensi MIT</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/dezzorigin/web-zip-archiver" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-zinc-900 transition-colors">
              <Github className="w-4 h-4" />
              dezzorigin/web-zip-archiver
            </a>
            <span>Dikembangkan oleh dezzorigin</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
