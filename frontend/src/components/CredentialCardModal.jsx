import React, { useState } from 'react';
import { ShieldCheck, Copy, Download, Printer, Check, X, KeyRound, Sparkles } from 'lucide-react';

export default function CredentialCardModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const roleTitle = credentials.role === 'FACULTY' ? 'FACULTY ACCOUNT' : 'STUDENT ACCOUNT';
  const identifierLabel = credentials.role === 'FACULTY' ? 'Faculty ID' : 'Student SIC / ID';
  const identifierValue = credentials.facultyId || credentials.studentId || credentials.email;

  const formattedText = `----------------------------------
IDEALAB SMART ATTENDANCE
${roleTitle}

Name: ${credentials.name}
${identifierLabel}: ${identifierValue}
Email: ${credentials.email}
Temporary Password: ${credentials.temporaryPassword}

Login Portal: http://localhost:5173/login

IMPORTANT:
Change password after first login.
----------------------------------`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([formattedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `IDEALAB_Credentials_${identifierValue}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>IdeaLab Credentials - ${identifierValue}</title>
          <style>
            body { font-family: monospace; padding: 40px; background: #f8fafc; color: #0f172a; }
            .card { border: 2px solid #6366f1; padding: 24px; border-radius: 12px; max-width: 450px; background: white; }
            h2 { color: #4338ca; margin-top: 0; }
            .field { margin-bottom: 12px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
            .val { font-size: 16px; font-weight: bold; }
            .highlight { background: #e0e7ff; padding: 4px 8px; border-radius: 6px; color: #3730a3; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>IDEALAB SMART ATTENDANCE</h2>
            <h3>${roleTitle}</h3>
            <div class="field"><div class="label">Full Name</div><div class="val">${credentials.name}</div></div>
            <div class="field"><div class="label">${identifierLabel}</div><div class="val">${identifierValue}</div></div>
            <div class="field"><div class="label">Email</div><div class="val">${credentials.email}</div></div>
            <div class="field"><div class="label">Temporary Password</div><div class="val highlight">${credentials.temporaryPassword}</div></div>
            <hr />
            <p style="font-size:11px; color:#64748b;">Notice: You will be prompted to change your temporary password upon first login.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 border-emerald-500/40 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Account Created Successfully
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{roleTitle}</h3>
          </div>
        </div>

        {/* Credential Card Display */}
        <div className="bg-[#0f172a]/90 border border-emerald-500/30 rounded-2xl p-5 font-mono space-y-4 shadow-inner mb-6">
          <div className="border-b border-emerald-500/20 pb-3 flex justify-between items-center">
            <span className="text-xs text-emerald-400 font-bold">IDEALAB INSTITUTIONAL ID</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              FIRST LOGIN REQUIRED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400 text-[10px] uppercase block">NAME</span>
              <span className="text-white font-bold text-sm">{credentials.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 text-[10px] uppercase block">{identifierLabel}</span>
                <span className="text-violet-300 font-bold">{identifierValue}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase block">ROLE</span>
                <span className="text-cyan-300 font-bold">{credentials.role}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 text-[10px] uppercase block">EMAIL</span>
              <span className="text-gray-200">{credentials.email}</span>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
              <span className="text-emerald-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> TEMPORARY PASSWORD
              </span>
              <span className="text-emerald-200 font-mono text-base font-black tracking-widest select-all">
                {credentials.temporaryPassword}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 font-mono text-center mb-6">
          Provide these login details to the user. The system will mandate a password update upon initial login.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
            <span>{copied ? 'Copied!' : 'COPY'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span>DOWNLOAD</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>PRINT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
