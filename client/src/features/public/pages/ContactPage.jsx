import { useCreateEnquiryMutation } from "../../api/gymApi.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getErrorMessage } from "../../../utils/errorUtils.js";
import { Button, Field } from "../../../components/common/UI.jsx";
import { ArrowUpRight } from "lucide-react";
import { z } from "zod";
const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email').max(254),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Use an international number, e.g. +919876543210'),
  message: z.string().trim().min(5, 'Tell us a little more').max(3000),
  enquiryType: z.enum(['general', 'trial'])
});
export function ContactPage({
  trial = false
}) {
  const [sendEnquiry, {
    isLoading
  }] = useCreateEnquiryMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      enquiryType: trial ? 'trial' : 'general'
    }
  });
  async function submit(values) {
    try {
      const response = await sendEnquiry(values).unwrap();
      toast.success(response.message || 'Your enquiry has been sent.');
      reset({
        enquiryType: trial ? 'trial' : 'general'
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <section className="page-enter mx-auto grid max-w-[1180px] gap-10 px-5 py-12 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-16"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{trial ? 'Your first session' : 'Get in touch'}</p><h1 className="mt-3 text-5xl font-bold uppercase leading-tight md:text-6xl">{trial ? 'Come try Zym.' : 'Letâ€™s talk.'}</h1><p className="mt-5 max-w-md text-sm leading-6 text-neutral-600">{trial ? 'Tell us a little about yourself and our team will follow up to arrange your visit.' : 'Ask us about memberships, coaching, or anything else. Weâ€™ll get back to you.'}</p><div className="mt-10 border-t border-neutral-200 pt-5"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Direct contact</p><a className="mt-2 inline-block text-lg font-semibold underline decoration-lime-400 underline-offset-4" href="mailto:hello@zym.fit">hello@zym.fit</a><p className="mt-4 text-sm text-neutral-600">Mon-Sat Â· 6 AM-10 PM</p></div></div>
    <form className="grid gap-5 border border-neutral-200 bg-neutral-50 p-5 md:p-8" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Your name" autoComplete="name" error={errors.name?.message} {...register('name')} /><Field label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /></div>
      <Field label="Phone number" type="tel" autoComplete="tel" hint="Include country code, e.g. +919876543210" error={errors.phone?.message} {...register('phone')} />
      <Field label="How can we help?" as="textarea" rows={5} className="resize-y" error={errors.message?.message} {...register('message')} />
      {!trial && <Field label="Enquiry type" as="select" error={errors.enquiryType?.message} {...register('enquiryType')}><option value="general">General question</option><option value="trial">Book a free trial</option></Field>}
      <Button className="w-full sm:w-fit" type="submit" disabled={isLoading}>{isLoading ? 'Sending...' : trial ? 'Request a trial' : 'Send enquiry'} <ArrowUpRight size={17} /></Button>
    </form>
  </section>;
}

