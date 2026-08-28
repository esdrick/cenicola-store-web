"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SafeImage from "@/components/ui/SafeImage";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { User, Package, LogOut, Loader2, Truck, Clock, XCircle, ArrowLeft, KeyRound, ChevronDown, ChevronUp, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import OrderProgressStepper from "@/components/store/OrderProgressStepper";
import ReuploadPaymentModal from "@/components/store/ReuploadPaymentModal";

interface OrderItem {
  id: string;
  product_name: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
  photo?: string | null;
}

interface OrderPayment {
  id: string;
  payment_type: string;
  amount_usd: number;
  amount_ves?: number | null;
  reference: string;
  status: string;
  rejection_reason?: string | null;
}

interface OrderShipment {
  tracking_number?: string | null;
  photo_package?: string | null;
  packed_at?: string | null;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_usd: number;
  total_bcv_usd: number;
  total_divisas_usd?: number;
  pricing_method?: string;
  customer_name?: string;
  customer_lastname?: string;
  shipping_company?: string | null;
  address?: string | null;
  items: OrderItem[];
  payments: OrderPayment[];
  shipment?: OrderShipment | null;
}

interface CustomerProfile {
  id: string;
  name: string;
  lastname: string;
  email: string;
  doc_type: string;
  doc_number: string;
  phone?: string | null;
  address?: string | null;
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center p-4 text-xs font-mono">Cargando...</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successParam = searchParams?.get("success") || "";
  const createdOrderNum = searchParams?.get("order") || "";

  const [showSuccessBanner, setShowSuccessBanner] = useState(successParam === "order_created");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [selectedReuploadOrder, setSelectedReuploadOrder] = useState<{
    orderNumber: string;
    email: string;
    isDivisasOrder: boolean;
  } | null>(null);

  const handleReuploadSuccess = () => {
    fetchProfileAndOrders();
  };

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Estados para Navbar, Carrito, Búsqueda y Lista de Deseos
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const { wishlistCount } = useWishlist();

  // Modo no-autenticado: "login" | "register" | "forgot"
  const [unauthMode, setUnauthMode] = useState<"login" | "register" | "forgot">("login");

  // Formulario de login real
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Formulario de recuperación de contraseña (Forgot & Reset)
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPin, setForgotPin] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSendForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await fetch("/api/store/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Error al solicitar código de recuperación.");
      } else {
        setForgotStep(2);
        setForgotSuccess(data.devPin ? `Código generado (PIN: ${data.devPin})` : "Ingresa el código PIN recibido en tu correo.");
      }
    } catch {
      setForgotError("Error de conexión al solicitar código.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await fetch("/api/store/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, pinCode: forgotPin, newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Error al restablecer la contraseña.");
      } else {
        setUnauthMode("login");
        setLoginEmail(forgotEmail);
        setForgotStep(1);
        setForgotEmail("");
        setForgotPin("");
        setForgotNewPassword("");
        setLoginError(null);
        alert("¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión.");
      }
    } catch {
      setForgotError("Error de conexión al cambiar la contraseña.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Formulario de registro real
  const [regName, setRegName] = useState("");
  const [regLastname, setRegLastname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regConfirmEmail, setRegConfirmEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDocType, setRegDocType] = useState("V");
  const [regDocNumber, setRegDocNumber] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);

  // Paso de verificación por PIN (si la cuenta lo requiere)
  const [showPinStep, setShowPinStep] = useState(false);
  const [pinEmail, setPinEmail] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [resendingPin, setResendingPin] = useState(false);
  const [resendPinSuccess, setResendPinSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileAndOrders();
    loadLocalCartAndWishlist();
  }, []);

  const loadLocalCartAndWishlist = () => {
    try {
      const savedCart = localStorage.getItem("cenicola_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Error loading cart:", e);
    }
  };

  const handleUpdateQuantity = (variant_id: string, qty: number) => {
    const updated = cart.map((i) => (i.variant_id === variant_id ? { ...i, quantity: qty } : i)).filter((i) => i.quantity > 0);
    setCart(updated);
    localStorage.setItem("cenicola_cart", JSON.stringify(updated));
  };

  const handleRemoveItem = (variant_id: string) => {
    const updated = cart.filter((i) => i.variant_id !== variant_id);
    setCart(updated);
    localStorage.setItem("cenicola_cart", JSON.stringify(updated));
  };

  const fetchProfileAndOrders = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/store/auth/me");
      const meData = await meRes.json();

      if (!meData.authenticated || !meData.customer) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(meData.customer);

      const ordersRes = await fetch("/api/store/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData.orders)) {
          setOrders(ordersData.orders);

          // Auto-expand the target order if redirected after checkout
          if (createdOrderNum) {
            const targetOrder = ordersData.orders.find(
              (o: CustomerOrder) => o.order_number.toLowerCase() === createdOrderNum.toLowerCase()
            );
            if (targetOrder) {
              setExpandedOrderIds((prev) => Array.from(new Set([...prev, targetOrder.id])));
            }
          }
        }
      }

      const prodRes = await fetch("/api/store/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.bcv_rate) setBcvRate(prodData.bcv_rate);
      }
    } catch (err) {
      console.error("AccountPage fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmittingLogin(true);

    try {
      const res = await fetch("/api/store/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification || data.require_pin) {
          setPinEmail(loginEmail.trim());
          setShowPinStep(true);
          setLoginError(null);
          setPinError(null);
          setPinCode("");
        } else {
          setLoginError(data.error || "Credenciales inválidas. Verifica tu correo y contraseña.");
        }
        setSubmittingLogin(false);
        return;
      }

      if (data.requiresVerification || data.require_pin) {
        setPinEmail(loginEmail.trim());
        setShowPinStep(true);
        setPinError(null);
        setPinCode("");
      } else {
        await fetchProfileAndOrders();
      }
    } catch {
      setLoginError("Error de conexión con el servidor");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleResendPin = async () => {
    if (!pinEmail) return;
    setResendingPin(true);
    setResendPinSuccess(null);
    setPinError(null);

    try {
      const res = await fetch("/api/store/auth/resend-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pinEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "Error al reenviar el código PIN");
      } else {
        setResendPinSuccess(data.message || "Un nuevo código PIN ha sido enviado a tu correo");
        setPinCode("");
      }
    } catch {
      setPinError("Error de conexión al reenviar PIN");
    } finally {
      setResendingPin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regEmail.trim().toLowerCase() !== regConfirmEmail.trim().toLowerCase()) {
      setRegError("Los correos electrónicos ingresados no coinciden.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    setSubmittingReg(true);

    try {
      const res = await fetch("/api/store/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          lastname: regLastname.trim(),
          email: regEmail.trim(),
          password: regPassword,
          doc_type: regDocType,
          doc_number: regDocNumber.trim(),
          phone: regPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Error al crear la cuenta. Intenta con otro correo.");
        setSubmittingReg(false);
        return;
      }

      setPinEmail(regEmail.trim());
      setShowPinStep(true);
      setPinCode("");
    } catch {
      setRegError("Error de conexión al registrar cuenta.");
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!pinCode.trim() || pinCode.trim().length !== 6) {
      setPinError("Ingresa el código PIN de 6 dígitos enviado a tu correo");
      return;
    }

    setPinSubmitting(true);

    try {
      const res = await fetch("/api/store/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pinEmail, pin_code: pinCode.trim() }),
      });

      const data = await res.json().catch(() => ({ error: "Error de servidor al verificar el código PIN" }));
      if (!res.ok) {
        setPinError(data.error || "Código PIN incorrecto o expirado");
        setPinSubmitting(false);
        return;
      }

      setShowPinStep(false);
      await fetchProfileAndOrders();
    } catch {
      setPinError("Error de conexión al verificar PIN");
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/store/auth/logout", { method: "POST" });
      setProfile(null);
      setOrders([]);
      router.refresh();
    } catch {
      setLoggingOut(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const getStatusBadge = (order: CustomerOrder) => {
    if (order.status === "cancelada") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancelado
        </span>
      );
    }

    const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
    const isPaymentRejected = latestPayment?.status === "rechazado";

    if (isPaymentRejected && order.status === "pendiente_pago") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-red-600" /> Pago Rechazado
        </span>
      );
    }

    switch (order.status) {
      case "pendiente_pago":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> En Revisión
          </span>
        );
      case "pago_verificado":
      case "en_embalaje":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-blue-600" /> En Embalaje
          </span>
        );
      case "completada":
      case "enviada":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-emerald-600" /> Enviado
          </span>
        );
      case "cancelada":
      case "rechazada":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      <StoreNavbar
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 space-y-6">
        {/* Top Header Bar matching checkout style */}
        <div className="flex justify-between items-center pb-2 text-xs uppercase tracking-wider">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-black transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VOLVER A TIENDA</span>
          </Link>

          <span className="text-slate-400 font-semibold tracking-wider">
            MI CUENTA
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-black" />
            <span className="uppercase tracking-[0.2em] font-semibold">Cargando información...</span>
          </div>
        ) : !profile ? (
          /* Non-authenticated View */
          <div className="max-w-md mx-auto">
            <section className="border border-slate-200 p-6 sm:p-8 space-y-6 bg-white rounded-xs">
              <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
                <h1 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                  MI CUENTA
                </h1>
                <span className="text-[10px] bg-slate-100 text-black font-semibold px-2 py-0.5 rounded-xs uppercase tracking-wider border border-slate-200">
                  Acceso Cliente
                </span>
              </div>

              {/* Navigation Tabs between Login and Register */}
              <div className="flex border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => { setUnauthMode("login"); setLoginError(null); }}
                  className={`py-2 px-3 sm:px-4 border-b-2 cursor-pointer transition-colors ${
                    unauthMode === "login"
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-slate-400 hover:text-black"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setUnauthMode("register"); setRegError(null); }}
                  className={`py-2 px-3 sm:px-4 border-b-2 cursor-pointer transition-colors ${
                    unauthMode === "register"
                      ? "border-black text-black font-semibold"
                      : "border-transparent text-slate-400 hover:text-black"
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {unauthMode === "login" ? (
                /* Vista 1: INICIA SESIÓN */
                <div className="space-y-6">
                  {/* Google Sign-In Button */}
                  <a
                    href="/api/store/auth/google?redirect=/cuenta"
                    className="w-full border border-slate-300 bg-white text-black py-3 px-4 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 rounded-xs shadow-2xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continuar con Google</span>
                  </a>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-widest absolute">o con tu correo</span>
                  </div>

                  {!showPinStep ? (
                    <form onSubmit={handleInlineLogin} className="space-y-4">
                      {loginError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0" />
                          {loginError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-black">
                            Contraseña *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setUnauthMode("forgot");
                              setForgotError(null);
                              setForgotSuccess(null);
                              if (loginEmail) setForgotEmail(loginEmail);
                            }}
                            className="text-[10px] text-slate-500 hover:text-black uppercase tracking-wider font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingLogin}
                        className="w-full bg-black text-white py-3.5 px-4 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer disabled:opacity-50 mt-2"
                      >
                        {submittingLogin ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Cargando...</span>
                          </>
                        ) : (
                          "Iniciar Sesión"
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Formulario PIN de Verificación si se requiere */
                    <form onSubmit={handleVerifyPinSubmit} className="bg-slate-50 p-5 border border-slate-200 rounded-xs space-y-4">
                      <div className="text-center space-y-1">
                        <KeyRound className="w-6 h-6 text-black mx-auto" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black">Verificación por Código PIN</h3>
                        <p className="text-[11px] text-slate-500">
                          Ingresa el PIN de 6 dígitos enviado a <strong className="text-black font-mono">{pinEmail}</strong>
                        </p>
                      </div>

                      {pinError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs text-center font-medium">
                          {pinError}
                        </div>
                      )}

                      {resendPinSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs text-center font-medium">
                          {resendPinSuccess}
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full text-center border border-slate-300 focus:border-black p-3 text-lg font-mono font-bold tracking-[0.5em] text-black focus:outline-none bg-white rounded-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPinStep(false)}
                          className="w-1/2 border border-slate-300 bg-white text-black text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Atrás
                        </button>

                        <button
                          type="submit"
                          disabled={pinSubmitting}
                          className="w-1/2 bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {pinSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar PIN"}
                        </button>
                      </div>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={handleResendPin}
                          disabled={resendingPin}
                          className="text-[11px] text-slate-500 hover:text-black font-semibold uppercase tracking-wider underline transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {resendingPin ? "Reenviando Código..." : "¿No recibiste el PIN? Reenviar Código"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : unauthMode === "register" ? (
                /* Vista 2: REGÍSTRATE / CREAR CUENTA */
                <div className="space-y-6">
                  {/* Google Sign-In Button */}
                  <a
                    href="/api/store/auth/google?redirect=/cuenta"
                    className="w-full border border-slate-300 bg-white text-black py-3 px-4 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 rounded-xs shadow-2xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Registrarme con Google</span>
                  </a>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-widest absolute">o completa el formulario</span>
                  </div>

                  {!showPinStep ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      {regError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0" />
                          {regError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="María"
                            className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                            Apellido *
                          </label>
                          <input
                            type="text"
                            required
                            value={regLastname}
                            onChange={(e) => setRegLastname(e.target.value)}
                            placeholder="Pérez"
                            className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Confirmar Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={regConfirmEmail}
                          onChange={(e) => setRegConfirmEmail(e.target.value)}
                          placeholder="Repite tu correo electrónico"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Confirmar Contraseña *
                        </label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Repite tu contraseña"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                            Tipo *
                          </label>
                          <select
                            value={regDocType}
                            onChange={(e) => setRegDocType(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white font-semibold"
                          >
                            <option value="V">V-</option>
                            <option value="E">E-</option>
                            <option value="J">J-</option>
                            <option value="G">G-</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                            Cédula / RIF *
                          </label>
                          <input
                            type="text"
                            required
                            value={regDocNumber}
                            onChange={(e) => setRegDocNumber(e.target.value)}
                            placeholder="12345678"
                            className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="04121234567"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReg}
                        className="w-full bg-black text-white py-3.5 px-4 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer disabled:opacity-50 mt-2"
                      >
                        {submittingReg ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creando Cuenta...</span>
                          </>
                        ) : (
                          "Registrarme"
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Formulario PIN de Verificación si se requiere */
                    <form onSubmit={handleVerifyPinSubmit} className="bg-slate-50 p-5 border border-slate-200 rounded-xs space-y-4">
                      <div className="text-center space-y-1">
                        <KeyRound className="w-6 h-6 text-black mx-auto" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black">Verificación por Código PIN</h3>
                        <p className="text-[11px] text-slate-500">
                          Ingresa el PIN de 6 dígitos enviado a <strong className="text-black font-mono">{pinEmail}</strong>
                        </p>
                      </div>

                      {pinError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs text-center font-medium">
                          {pinError}
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full text-center border border-slate-300 focus:border-black p-3 text-lg font-mono font-bold tracking-[0.5em] text-black focus:outline-none bg-white rounded-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPinStep(false)}
                          className="w-1/2 border border-slate-300 bg-white text-black text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Atrás
                        </button>

                        <button
                          type="submit"
                          disabled={pinSubmitting}
                          className="w-1/2 bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {pinSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar PIN"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Vista 3: RESTABLECER CONTRASEÑA */
                <div className="space-y-5">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setUnauthMode("login")}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-black transition-colors mb-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver a Iniciar Sesión
                    </button>

                    <h2 className="text-xs font-semibold uppercase tracking-wider text-black">
                      RECUPERACIÓN DE CONTRASEÑA
                    </h2>
                    <p className="text-xs text-slate-600 font-normal">
                      {forgotStep === 1
                        ? "Ingresa tu correo electrónico registrado y te enviaremos un código PIN para restablecer tu contraseña."
                        : `Ingresa el código PIN recibido en ${forgotEmail} y define tu nueva contraseña.`}
                    </p>
                  </div>

                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs font-medium">
                      {forgotSuccess}
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendForgotPin} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-black text-white py-3.5 px-4 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer disabled:opacity-50 mt-2"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Enviando Código...</span>
                          </>
                        ) : (
                          "Enviar Código de Recuperación"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Código PIN (6 dígitos) *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={forgotPin}
                          onChange={(e) => setForgotPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-[0.4em] text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                          Nueva Contraseña *
                        </label>
                        <input
                          type="password"
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="w-1/2 border border-slate-300 bg-white text-black text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Reenviar PIN
                        </button>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-1/2 bg-black text-white text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cambiar Contraseña"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Authenticated User View - Clean Page Layout without Outer Main Card */
          <div className="space-y-6">
            {/* Greeting & Logout Header */}
            <div className="pb-3 border-b border-slate-200 flex flex-row items-center justify-between gap-4 w-full">
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black truncate">
                HOLA, {profile.name ? profile.name.trim().split(" ")[0].toUpperCase() : "CLIENTE"}
              </h1>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black border border-slate-300 bg-white px-3.5 py-2 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              >
                {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Cerrar Sesión</span>
              </button>
            </div>

            {/* Navigation Tabs for User Dashboard */}
            <div className="flex border-b border-slate-200 text-xs font-semibold uppercase tracking-wider gap-6 pt-1">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "orders" ? "border-black text-black font-semibold" : "border-transparent text-slate-400 hover:text-black"
                }`}
              >
                <Package className="w-4 h-4" /> Mis Pedidos ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "profile" ? "border-black text-black font-semibold" : "border-transparent text-slate-400 hover:text-black"
                }`}
              >
                <User className="w-4 h-4" /> Mis Datos
              </button>
            </div>

            {/* Tab 1: Orders List */}
            {activeTab === "orders" && (
              <div className="space-y-4 pt-2">
                {showSuccessBanner && createdOrderNum && (
                  <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xs p-4 sm:p-5 flex items-start justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-950">
                          ¡Pedido #{createdOrderNum} registrado con éxito!
                        </h4>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                          Tu orden ha sido recibida correctamente y se encuentra en proceso de verificación de pago. A continuación puedes ver el estado detallado.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSuccessBanner(false)}
                      className="text-emerald-700 hover:text-emerald-950 p-1 rounded-xs transition-colors"
                      title="Cerrar mensaje"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="py-12 sm:py-16 text-center border border-slate-200 p-6 sm:p-10 space-y-3 bg-white rounded-xs">
                    <Package className="w-9 h-9 text-slate-400 mx-auto" />
                    <h3 className="font-semibold text-black uppercase tracking-wider text-xs sm:text-sm">Aún no tienes pedidos registrados</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                      Explora nuestras colecciones de prendas y realiza tu primer pedido directamente en la web.
                    </p>
                    <Link
                      href="/catalogo"
                      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 text-xs uppercase tracking-widest font-bold rounded-xs hover:bg-slate-800 transition-colors mt-2"
                    >
                      Explorar Catálogo
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrderIds.includes(order.id);
                    const isNewOrder = createdOrderNum && order.order_number.toLowerCase() === createdOrderNum.toLowerCase();
                    const isVesOrder = Number(order.total_bcv_usd || 0) > 0;
                    const vesPaymentTypes = ["efectivo_bs", "transferencia", "pago_movil"];
                    const vesPaymentSum = order.payments?.reduce((sum, p) => {
                      if (vesPaymentTypes.includes(String(p.payment_type)) && p.amount_ves) {
                        return sum + Number(p.amount_ves);
                      }
                      return sum;
                    }, 0) || 0;

                    const totalVesDisplay = isVesOrder
                      ? vesPaymentSum > 0
                        ? vesPaymentSum
                        : Number(order.total_bcv_usd || order.total_usd) * bcvRate
                      : 0;

                    return (
                      <div
                        key={order.id}
                        className="border border-slate-200 bg-white rounded-xs overflow-hidden transition-all"
                      >
                        {/* Clean White Header for each Order Card */}
                        <div
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none w-full"
                        >
                          <div className="flex items-center gap-6 flex-wrap">
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Número de Orden</p>
                              <p className="font-mono font-bold text-sm text-black flex items-center gap-1.5">
                                <span>#{order.order_number}</span>
                                {isNewOrder && (
                                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-xs font-sans uppercase font-bold tracking-wider">
                                    NUEVA
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Fecha</p>
                              <p className="text-xs font-medium text-slate-700">
                                {new Date(order.created_at).toLocaleDateString("es-VE", {
                                  day: "2-digit", month: "short", year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Compra</p>
                              <p className="font-mono font-bold text-sm text-black">
                                ${Number(order.total_usd).toFixed(2)}
                                {totalVesDisplay > 0 && (
                                  <span className="text-[11px] font-mono font-normal text-slate-500 ml-1.5">
                                    (Bs. {totalVesDisplay.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 shrink-0 ml-auto text-right">
                            <div>{getStatusBadge(order)}</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpand(order.id);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black border border-slate-300 bg-white px-3 py-1.5 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                            >
                              <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Order Details Accordion */}
                        {isExpanded && (
                          <div className="p-5 sm:p-7 space-y-6 bg-white animate-in fade-in-0 duration-200">
                            {/* Order Stepper Progress / Rejection Box */}
                            {(() => {
                              if (order.status === "cancelada") {
                                return <OrderProgressStepper status="cancelada" />;
                              }

                              const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
                              const isPaymentRejected = latestPayment?.status === "rechazado";

                              if (!isPaymentRejected || order.status !== "pendiente_pago") {
                                return <OrderProgressStepper status={order.status} />;
                              }

                              return (
                                <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-xs space-y-3">
                                  <div className="flex items-center gap-2 text-red-900 font-bold uppercase text-xs">
                                    <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                                    <span>Atención: Pago Rechazado</span>
                                  </div>
                                  <p className="text-xs text-red-800 font-normal">
                                    No pudimos validar tu comprobante de pago para este pedido.
                                  </p>
                                  <div className="bg-white p-3 rounded-xs border border-red-200 space-y-1">
                                    <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                                      Motivo del Rechazo:
                                    </span>
                                    <p className="text-red-900 font-medium text-xs font-mono">
                                      {latestPayment?.rejection_reason || "Comprobante de pago no válido o referencia incorrecta."}
                                    </p>
                                  </div>
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const isDivisasOrder =
                                          order.pricing_method === "divisas" ||
                                          Number(order.total_divisas_usd || 0) > 0 ||
                                          Boolean(order.payments?.some((p) => ["zelle", "usdt", "efectivo_usd"].includes(p.payment_type)));
                                        setSelectedReuploadOrder({ orderNumber: order.order_number, email: profile?.email || "", isDivisasOrder });
                                        setReuploadModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-xs transition-colors cursor-pointer shadow-xs"
                                    >
                                      <Upload className="w-4 h-4" />
                                      <span>Volver a subir comprobante de pago</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Items Breakdown */}
                            <div className="space-y-3 pt-2">
                              <h4 className="text-xs font-semibold text-black uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center justify-between">
                                <span>PRENDAS EN EL PEDIDO ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                              </h4>

                              <div className="divide-y divide-slate-100 border-b border-slate-200 pb-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="relative w-14 aspect-[3/4] bg-slate-100 shrink-0 overflow-hidden border border-slate-200 rounded-xs">
                                        <SafeImage src={item.photo} alt={item.product_name} fill sizes="60px" className="object-cover" />
                                      </div>
                                      <div className="min-w-0 space-y-0.5">
                                        <p className="font-semibold text-black uppercase tracking-wider line-clamp-1">
                                          {item.product_name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase">
                                          TALLA: <span className="font-semibold text-black">{item.size || "N/A"}</span>
                                          {item.color && ` | COLOR: ${item.color}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-normal">
                                          Cantidad: <span className="font-semibold text-black">{item.quantity}</span> × ${Number(item.unit_price_usd).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-bold text-black text-sm block">
                                        ${Number(item.subtotal_usd).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Shipping and Dispatch Box */}
                              {order.shipment && (
                                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xs space-y-3 text-xs mt-3">
                                  <div className="flex items-center gap-2 text-black font-semibold uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                                    <Truck className="w-4 h-4 text-black" /> DATOS DE ENVÍO Y DESPACHO
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                                    <div>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Empresa de Envío</span>
                                      <span className="font-semibold text-black text-xs">{order.shipping_company || "MRW / Zoom"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Número de Guía / Tracking</span>
                                      <span className="font-mono font-bold text-black text-xs">{order.shipment.tracking_number || "En proceso..."}</span>
                                    </div>
                                  </div>

                                  {order.shipment.photo_package && (
                                    <div className="pt-3 text-center border-t border-slate-200">
                                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Comprobante de Paquete Embalado:</p>
                                      <a href={order.shipment.photo_package} target="_blank" rel="noopener noreferrer" className="inline-block relative w-44 h-44 border border-slate-200 rounded-xs shadow-xs hover:opacity-90 transition-opacity mx-auto">
                                        <Image src={order.shipment.photo_package} alt="Paquete listo" fill className="object-cover rounded-xs" unoptimized />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Profile Info */}
            {activeTab === "profile" && (
              <div className="border border-slate-200 p-6 sm:p-8 bg-white rounded-xs space-y-6">
                <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                    INFORMACIÓN PERSONAL REGISTRADA
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-black font-semibold px-2 py-0.5 rounded-xs uppercase tracking-wider border border-slate-200">
                    Perfil Verificado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Nombre y Apellido
                    </span>
                    <p className="font-semibold text-black text-sm">{profile.name} {profile.lastname}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Cédula / RIF
                    </span>
                    <p className="font-mono font-semibold text-black text-sm">
                      {profile.doc_number && !profile.doc_number.startsWith("TEMP-")
                        ? `${profile.doc_type}-${profile.doc_number}`
                        : "No especificado"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Correo Electrónico
                    </span>
                    <p className="font-mono font-semibold text-black text-xs sm:text-sm">{profile.email}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Teléfono de Contacto
                    </span>
                    <p className="font-semibold text-black text-sm">{profile.phone || "No especificado"}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Dirección de Envío Predeterminada
                    </span>
                    <p className="font-semibold text-black text-sm leading-relaxed">{profile.address || "No especificada"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Drawers conectados e interactivos */}
      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchSubmit={(q) => router.push(`/catalogo?q=${encodeURIComponent(q)}`)}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        bcvRate={bcvRate}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />

      {selectedReuploadOrder && (
        <ReuploadPaymentModal
          isOpen={reuploadModalOpen}
          onClose={() => setReuploadModalOpen(false)}
          orderNumber={selectedReuploadOrder.orderNumber}
          customerEmail={selectedReuploadOrder.email}
          isDivisasOrder={selectedReuploadOrder.isDivisasOrder}
          onSuccess={handleReuploadSuccess}
        />
      )}

      <StoreFooter />
    </div>
  );
}
