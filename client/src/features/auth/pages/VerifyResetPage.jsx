import { useVerifyResetOtpMutation } from "../authApi.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
const resetOtpSchema = z.object({
  identifier: z.string().trim().min(1),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')
});
export function VerifyResetPage() {
  const [verify, {
    isLoading
  }] = useVerifyResetOtpMutation();
  const navigate = useNavigate();
  const identifier = new URLSearchParams(useLocation().search).get('identifier') || '';
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(resetOtpSchema),
    defaultValues: {
      identifier,
      otp: ''
    }
  });
  async function submit(values) {
    try {
      await verify(values).unwrap();
      toast.success('Code verified. Choose a new password.');
      navigate('/reset-password', {
        state: {
          identifier: values.identifier
        }
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <AuthFrame eyebrow="Account recovery" title="Enter your code." detail="Use the six-digit code sent to your verified email or phone."><form className="grid gap-5" onSubmit={handleSubmit(submit)}><Field label="Email or verified phone" error={errors.identifier?.message} {...register('identifier')} /><Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={errors.otp?.message} {...register('otp')} /><Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify code'} <ArrowUpRight size={16} /></Button></form></AuthFrame>;
}

