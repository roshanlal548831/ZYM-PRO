import { useResendOtpMutation } from "../authApi.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getErrorMessage } from "../../../utils/errorUtils.js";
import { Button, Field } from "../../../components/common/UI.jsx";
import { ArrowLeft, ArrowUpRight, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
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
export function ResendOtpPage() {
  const [resend, {
    isLoading
  }] = useResendOtpMutation();
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(z.object({
      email: emailSchema,
      purpose: z.enum(['signup', 'password-reset'])
    })),
    defaultValues: {
      purpose: 'signup'
    }
  });
  async function submit(values) {
    try {
      const response = await resend(values).unwrap();
      toast.success(response.message || 'If eligible, a code has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <AuthFrame eyebrow="Verification code" title="Send a new code." detail="Choose whether you need a signup code or a password reset code."><form className="grid gap-5" onSubmit={handleSubmit(submit)}><Field label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><Field label="Code purpose" as="select" error={errors.purpose?.message} {...register('purpose')}><option value="signup">Verify new account</option><option value="password-reset">Reset password</option></Field><Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send code'} <ArrowUpRight size={16} /></Button></form></AuthFrame>;
}

