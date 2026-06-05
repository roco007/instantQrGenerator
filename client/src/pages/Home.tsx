import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type TimeoutId = ReturnType<typeof setTimeout>;

// Declare QRCode from CDN
declare global {
  interface Window {
    QRCode: any;
  }
}

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceTimerRef = useRef<TimeoutId | null>(null);
  const [qrcodeReady, setQrcodeReady] = useState(false);

  // Initialize QRCode library
  useEffect(() => {
    const checkQRCode = () => {
      if (window.QRCode) {
        setQrcodeReady(true);
      } else {
        setTimeout(checkQRCode, 100);
      }
    };
    checkQRCode();
  }, []);

  // Generate QR Code
  const generateQR = useCallback(async (text: string) => {
    if (!text.trim()) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    if (!qrcodeReady || !window.QRCode) {
      console.warn('QRCode not ready yet');
      return;
    }

    try {
      setIsLoading(true);
      if (canvasRef.current) {
        // Generate at preview size (240x240px)
        await window.QRCode.toCanvas(canvasRef.current, text, {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  }, [qrcodeReady]);

  // Debounced input handler
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void generateQR(input);
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, generateQR]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  }, [input]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInput('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  // Handle download - generate high-res version
  const handleDownload = useCallback(async () => {
    if (!input.trim() || !qrcodeReady || !window.QRCode) return;

    try {
      setIsLoading(true);
      // Create a temporary canvas for high-res generation
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 1000;
      tempCanvas.height = 1000;

      await window.QRCode.toCanvas(tempCanvas, input, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      const dataUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qrcode-instant.png';
      link.href = dataUrl;
      link.click();
      toast.success('QR code downloaded!');
    } catch (err) {
      console.error('Download Error:', err);
      toast.error('Failed to download QR code');
    } finally {
      setIsLoading(false);
    }
  }, [input, qrcodeReady]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-indigo-600 p-2">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Instant<span className="text-indigo-400">QR</span>
              </h1>
            </div>
            <div className="hidden items-center space-x-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-400 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              <span>Client-Side Secured</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-grow items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          {/* Left Side: Input */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-sm md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <label
                  htmlFor="qr-input"
                  className="text-sm font-medium uppercase tracking-wider text-slate-400"
                >
                  Input Content
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => void handleCopy()}
                    disabled={!input}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-400/10 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleClear()}
                    disabled={!input}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Clear input"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <textarea
                id="qr-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Paste your URL or text here..."
              />

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
                  <p className="mb-1 text-xs text-slate-500">Format</p>
                  <p className="text-sm font-medium">PNG Image</p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
                  <p className="mb-1 text-xs text-slate-500">Error Correction</p>
                  <p className="text-sm font-medium">Medium (M)</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
              <svg
                className="h-5 w-5 flex-shrink-0 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm leading-relaxed text-indigo-300/80">
                Your data never leaves your browser. Generation happens locally for maximum privacy and speed.
              </p>
            </div>
          </div>

          {/* Right Side: Preview */}
          <div className="lg:sticky lg:top-32">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-sm md:p-8">
              <label className="mb-6 inline-block text-sm font-medium uppercase tracking-wider text-slate-400">
                Live Preview
              </label>

              <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-white p-6 shadow-inner">
                {input ? (
                  <div className="flex items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      style={{
                        animation: 'fadeIn 0.3s ease-out',
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-slate-300">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                      <svg
                        className="h-10 w-10 text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Awaiting Input...</p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={() => void handleDownload()}
                  disabled={!input || isLoading}
                  className="w-full bg-indigo-600 py-4 font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download PNG
                </Button>
                <p className="text-center text-xs text-slate-500">High-resolution 1000x1000px output</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-slate-500">
            Built with Tailwind CSS & node-qrcode • No Tracking • No Backend
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
