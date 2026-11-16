/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Zap,
  CheckCircle2,
  RefreshCw,
  Bus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Clock,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TransitFareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransitFareModal: React.FC<TransitFareModalProps> = ({ isOpen, onClose }) => {
  const [balance, setBalance] = useState<number>(42.5);
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'moeda_verde' | 'v2g'>('pix');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecharge = () => {
    setIsProcessing(true);
    soundManager.playClick();

    setTimeout(() => {
      setIsProcessing(false);
      setBalance((prev) => prev + selectedAmount);
      soundManager.playAlert();
      setNotification(`Recarga de R$ ${selectedAmount.toFixed(2)} confirmada via ${paymentMethod.toUpperCase()}! Saldo atualizado.`);
      setTimeout(() => setNotification(null), 4000);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white shadow-md">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  VEM Digital 2050 – Recarga Inteligente
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  NFC & Biometria
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bilhete Único Multimodal Metropolitano: BRT Elétrico, Catamarã Solar, Bondes e E-Bikes
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[82vh]">
          {/* Virtual Smart Card */}
          <div className="relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-cyan-900 via-slate-900 to-emerald-950 border border-cyan-500/40 shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Bus className="w-44 h-44 text-cyan-200" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono tracking-widest text-cyan-300 font-bold">VEM CONECTA 2050</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TARIFA ZERO CARBONO
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Recife Metropolitano Multimodal</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-300">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Saldo Disponível:</div>
                  <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                    <span className="text-emerald-400">R$</span> {balance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">ID: 2050-REC-8491-04</div>
                  <div className="text-xs font-medium text-cyan-300 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Biometria Facial Ativa
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Quick Recharge Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Selecione o Valor de Recarga:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[20, 50, 100, 180].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedAmount(amt);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedAmount === amt
                      ? 'bg-cyan-950 border-cyan-500 ring-2 ring-cyan-500/40 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-lg font-bold">R$ {amt}</div>
                  <div className="text-[10px] text-slate-400">
                    {amt === 180 ? 'Passe Mensal Ilimitado' : `${Math.floor(amt / 4.5)} viagens BRT`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Forma de Pagamento Inteligente:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setPaymentMethod('pix');
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Pix Quântico</div>
                  <div className="text-[10px] text-slate-400">Instantâneo sem taxa</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setPaymentMethod('moeda_verde');
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  paymentMethod === 'moeda_verde'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 text-emerald-400">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Moeda Verde / Reciclagem</div>
                  <div className="text-[10px] text-slate-400">Créditos por reciclar resíduos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setPaymentMethod('v2g');
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  paymentMethod === 'v2g'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 text-amber-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Energia Solar V2G</div>
                  <div className="text-[10px] text-slate-400">Troca de kWh por passagens</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleRecharge}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando Recarga Digital...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Recarregar R$ {selectedAmount.toFixed(2)} Agora</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {/* Recent Trip History */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Histórico Recente de Embarques (Integração Total):
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Bus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BRT Elétrico: Estação Beira-Rio ➔ Marco Zero</span>
                </div>
                <span className="font-mono text-emerald-400">R$ 0,00 (Integrado)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Catamarã Solar: Píer Capibaribe ➔ Bacia do Pina</span>
                </div>
                <span className="font-mono text-slate-300">-R$ 4,50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
