import { useForgotPasswordMutation } from "../authApi.js";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getErrorMessage } from "../../../utils/errorUtils.js";
import { Button, Field } from "../../../components/common/UI.jsx";
import { ArrowLeft, ArrowUpRight, Dumbbell } from "lucide-react";
import { z } from "zod";
function AuthFrame({
  eyebrow,
  title,
  detail,
  children
}) {
  return <section className="page-enter mx-auto grid min-h-[620px] max-w-[1180px] gap-10 px-5 py-12 md:grid-cols-[.9fr_1.1fr] md:items-center md:px-8 md:py-16">
    <div className="relative hidden min-h-[500px] overflow-hidden bg-neutral-950 p-9 text-white md:flex md:flex-col md:justify-between"><img className="absolute inset-0 h-full w-full object-cover opacity-40" src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1100&q=80" alt="Athlete preparing to train" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" /><Link to="/" className="relative flex items-center gap-2"><Dumbbell size={19} /><span className="display-font text-xl font-bold">ZYM.</span></Link><div className="relative"><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Move with purpose</p><p className="display-font mt-3 max-w-md text-4xl font-semibold uppercase leading-tight">Show up today.<br />Thank yourself later.</p></div></div>
    <div className="mx-auto w-full max-w-lg"><Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"><ArrowLeft size={16} />Back to Zym</Link><p className="text-xs font-bold uppercase tracking-[.14em] text-neutral-500">{eyebrow}</p><h1 className="mt-2 text-4xl font-bold uppercase">{title}</h1>{detail && <p className="mt-3 text-sm leading-6 text-neutral-600">{detail}</p>}<div className="mt-8">{children}</div></div>
  </section>;
}
const identifierSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or verified phone number').max(254)
});
export function ForgotPasswordPage() {
  const [forgot, {
    isLoading
  }] = useForgotPasswordMutation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(identifierSchema)
  });
  async function submit({
    identifier
  }) {
    try {
      const response = await forgot({
        identifier
      }).unwrap();
      toast.success(response.message);
      navigate(`/verify-reset?identifier=${encodeURIComponent(identifier)}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <AuthFrame eyebrow="Account recovery" title="Reset your password." detail="Use your email or verified phone number. For privacy, the response is the same whether or not an account can receive a code."><form className="grid gap-5" onSubmit={handleSubmit(submit)}><Field label="Email or verified phone" autoComplete="username" error={errors.identifier?.message} {...register('identifier')} /><Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Requesting...' : 'Send reset code'} <ArrowUpRight size={16} /></Button><Link to="/login" className="text-center text-sm font-semibold underline decoration-lime-500 underline-offset-4">Back to sign in</Link></form></AuthFrame>;
}

