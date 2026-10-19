import { useResendOtpMutation, useVerifyEmailMutation } from "../authApi.js";
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
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email').max(254);
const otpSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')
});
export function VerifyEmailPage() {
  const [verify, {
    isLoading
  }] = useVerifyEmailMutation();
  const [resend, {
    isLoading: isResending
  }] = useResendOtpMutation();
  const navigate = useNavigate();
  const email = new URLSearchParams(useLocation().search).get('email') || '';
  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email,
      otp: ''
    }
  });
  async function submit(values) {
    try {
      const user = await verify(values).unwrap();
      toast.success('Email verified. You are signed in.');
      navigate(user.role === 'admin' ? '/admin' : '/app', {
        replace: true
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  async function resendCode() {
    if (!getValues('email')) {
      toast.error('Enter the account email first.');
      return;
    }
    try {
      const response = await resend({
        email: getValues('email'),
        purpose: 'signup'
      }).unwrap();
      toast.success(response.message || 'If eligible, a new code has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <AuthFrame eyebrow="Email verification" title="Check your inbox." detail="Enter the six-digit code sent to your email address."><form className="grid gap-5" onSubmit={handleSubmit(submit)}><Field label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={errors.otp?.message} {...register('otp')} /><Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify email'} <ArrowUpRight size={16} /></Button><Button className="w-full" variant="outline" type="button" disabled={isResending} onClick={resendCode}>{isResending ? 'Sending...' : 'Resend code'}</Button></form></AuthFrame>;
}

