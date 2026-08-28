"use client";

import { Check, XCircle } from "lucide-react";

interface Props {
  status: string;
}

const STEPS = [
  { id: 1, label: "Pedido Recibido", shortLabel: "Recibido" },
  { id: 2, label: "Pago Verificado", shortLabel: "Verificado" },
  { id: 3, label: "En Embalaje", shortLabel: "Embalaje" },
  { id: 4, label: "Pedido Enviado", shortLabel: "Enviado" },
  { id: 5, label: "Entregado", shortLabel: "Entregado" },
];

export function getStepIndex(status: string): number {
  switch (status) {
    case "pendiente_pago":
      return 1;
    case "pago_parcial":
    case "pago_verificado":
      return 2;
    case "en_embalaje":
      return 3;
    case "listo_para_retiro":
    case "enviada":
      return 4;
    case "completada":
      return 5;
    default:
      return 1;
  }
}

export default function OrderProgressStepper({ status }: Props) {
  if (status === "cancelada") {
    return (
      <div className="border border-red-200 p-4 text-center space-y-1 my-3 bg-red-50/60 rounded-xs">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-900 uppercase tracking-wider">
          <XCircle className="w-4 h-4 text-red-600" /> Orden Cancelada
        </div>
        <p className="text-[11px] text-red-700 font-normal">
          Esta orden ha sido cancelada. Si tienes dudas sobre tu pago o pedido, por favor contáctanos.
        </p>
      </div>
    );
  }

  const currentStep = getStepIndex(status);
  const activeStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];

  return (
    <div className="w-full py-4 my-2 bg-white rounded-xs">
      <div className="relative w-full max-w-xl mx-auto px-2 sm:px-4">
        {/* Continuous Line */}
        <div className="absolute top-3.5 sm:top-4 left-[10%] right-[10%] h-[1px] bg-slate-200 -z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute top-3.5 sm:top-4 left-[10%] right-[10%] h-[1.5px] bg-black transition-all duration-500 -z-0 origin-left"
          style={{
            transform: `scaleX(${((currentStep - 1) / (STEPS.length - 1))})`,
            width: "80%",
          }}
        />

        {/* Steps Grid */}
        <div className="relative z-10 flex items-start justify-between w-full">
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center text-center w-1/5 px-0.5">
                {/* Step Dot */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xs flex items-center justify-center text-[10px] sm:text-xs font-mono transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? "bg-black text-white border border-black font-bold"
                      : "bg-white text-slate-400 border border-slate-300"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2">
                  <span
                    className={`block text-[10px] sm:text-[11px] uppercase tracking-wider ${
                      isCompleted || isCurrent ? "text-black font-semibold" : "text-slate-400 font-normal"
                    }`}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status text indicator below */}
        <div className="mt-4 text-center">
          <span className="text-[11px] uppercase tracking-widest text-slate-600 font-normal border-t border-slate-200 pt-2 inline-block">
            ESTADO ACTUAL: <strong className="font-semibold text-black">{activeStepObj.label.toUpperCase()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}


