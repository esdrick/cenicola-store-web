"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  customerEmail: string;
  isDivisasOrder?: boolean;
  onSuccess: () => void;
}

export default function ReuploadPaymentModal({
  isOpen,
  onClose,
  orderNumber,
  customerEmail,
  isDivisasOrder = false,
  onSuccess,
}: Props) {
  const [paymentType, setPaymentType] = useState(isDivisasOrder ? "zelle" : "pago_movil");
  const [reference, setReference] = useState("");
  const [paymentPhoto, setPaymentPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/store/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Error al subir la imagen del comprobante");
      }

      setPaymentPhoto(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo subir la foto del comprobante";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reference.trim() || reference.trim().length < 4) {
      setErrorMsg("Ingresa una referencia válida (mínimo 4 dígitos)");
      return;
    }

    if (!paymentPhoto) {
      setErrorMsg("Debes adjuntar la foto o captura de tu nuevo comprobante de pago");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/store/orders/reupload-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: orderNumber,
          email: customerEmail,
          payment_type: paymentType,
          reference: reference.trim(),
          payment_photo: paymentPhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el nuevo pago");
      }

      setSuccessMsg(data.message || "Nuevo comprobante enviado con éxito. Estamos verificando tu pago.");
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMsg(null);
        setReference("");
        setPaymentPhoto("");
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar el comprobante.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xs shadow-2xl overflow-hidden text-black font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black">
              Adjuntar Nuevo Comprobante de Pago
            </h3>
            <p className="text-[11px] font-mono text-slate-500">
              Pedido #{orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-black transition-colors rounded-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Currency restriction callout info */}
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xs font-medium flex items-start gap-2">
              <span className="shrink-0 text-sm">💡</span>
              <span>
                {isDivisasOrder
                  ? "Esta orden fue realizada originalmente en divisas. El nuevo pago debe enviarse mediante un método en divisas (Zelle o USDT)."
                  : "Esta orden fue realizada originalmente en bolívares (BCV). El nuevo pago debe enviarse mediante un método en bolívares (Pago Móvil o Transferencia)."}
              </span>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                Método de Pago Utilizado *
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white font-semibold"
              >
                {isDivisasOrder ? (
                  <>
                    <option value="zelle">Zelle (USD)</option>
                    <option value="usdt">USDT (Binance Pay / Crypto)</option>
                  </>
                ) : (
                  <>
                    <option value="pago_movil">Pago Móvil (Bs)</option>
                    <option value="transferencia">Transferencia Bancaria (Bs)</option>
                  </>
                )}
              </select>
            </div>

            {/* Número de Referencia */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                Número de Referencia / Comprobante *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. 123456"
                className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white font-mono placeholder:text-slate-400"
              />
            </div>

            {/* Foto o Captura de Comprobante */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                Foto o Captura del Nuevo Comprobante *
              </label>

              {paymentPhoto ? (
                <div className="relative border border-slate-200 bg-slate-50 p-2 rounded-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 border border-slate-200 rounded-xs shrink-0 overflow-hidden">
                      <Image
                        src={paymentPhoto}
                        alt="Comprobante nuevo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-700 block truncate">
                        ✓ Comprobante listo para enviar
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate font-mono">
                        {paymentPhoto.split("/").pop()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentPhoto("")}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 uppercase tracking-wider cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-black bg-slate-50 hover:bg-white p-5 rounded-xs flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold uppercase tracking-wider">
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>Subiendo comprobante...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                      <span className="text-xs font-semibold text-black uppercase tracking-wider">
                        Haz clic para subir tu captura o foto
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Formatos soportados: JPG, PNG, WEBP (Máx. 10MB)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 border border-slate-300 text-black text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting || uploading || !paymentPhoto}
                className="px-5 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-widest rounded-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  "Enviar Nuevo Pago"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
