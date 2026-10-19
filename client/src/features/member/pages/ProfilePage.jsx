import { useGetProfileQuery, useUpdateProfileMutation } from "../../api/gymApi.js";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ErrorState, Field, LoadingState, PageHeading, StatusBadge } from "../../../components/common/UI.jsx";
import { toast } from "sonner";
import { getErrorMessage } from "../../../utils/errorUtils.js";
import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters').max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Use an international number').or(z.literal(''))
});
export function ProfilePage() {
  const {
    data: profile,
    isLoading,
    isError,
    refetch
  } = useGetProfileQuery();
  const [updateProfile, {
    isLoading: isSaving
  }] = useUpdateProfileMutation();
  const [removeImage, setRemoveImage] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(profileSchema)
  });
  useEffect(() => {
    if (profile) reset({
      name: profile.name,
      phone: profile.phone || ''
    });
  }, [profile, reset]);
  if (isLoading) return <LoadingState label="Loading profile" />;
  if (isError && !profile) return <ErrorState message="Your profile could not be loaded." onRetry={refetch} />;
  if (!profile) return <ErrorState message="Your profile data is unavailable." onRetry={refetch} />;
  async function submit(values) {
    const file = document.getElementById('profile-image')?.files?.[0];
    const phone = values.phone || null;
    try {
      let body;
      if (file) {
        body = new FormData();
        body.append('name', values.name);
        if (phone) body.append('phone', phone);
        body.append('image', file);
      } else {
        body = {
          name: values.name,
          phone
        };
        if (removeImage) body.profileImage = null;
      }
      await updateProfile(body).unwrap();
      toast.success('Profile updated.');
      setRemoveImage(false);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return <div className="page-enter"><PageHeading eyebrow="Account" title="My profile" detail="Update your contact details and profile photo." /><div className="grid gap-7 lg:grid-cols-[260px_1fr]">
    <aside className="border border-neutral-200 bg-white p-5"><div className="grid aspect-square place-items-center overflow-hidden bg-neutral-100">{profile.profileImage ? <img className="h-full w-full object-cover" src={profile.profileImage} alt="Your profile" /> : <UserRound size={52} className="text-neutral-400" />}</div><p className="mt-4 truncate font-semibold">{profile.name}</p><p className="mt-1 truncate text-sm text-neutral-500">{profile.email}</p><div className="mt-4 flex gap-2"><StatusBadge value={profile.isEmailVerified ? 'active' : 'pending'} /><span className="self-center text-xs text-neutral-500">Email {profile.isEmailVerified ? 'verified' : 'unverified'}</span></div>{profile.profileImage && <label className="mt-4 flex items-center gap-2 text-xs text-neutral-600"><input type="checkbox" checked={removeImage} onChange={event => setRemoveImage(event.target.checked)} />Remove current photo</label>}</aside>
    <form className="grid content-start gap-5 border border-neutral-200 bg-white p-5 md:p-7" onSubmit={handleSubmit(submit)}><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} /><Field label="Email address" type="email" value={profile.email} disabled hint="Email changes are not available through this endpoint." /></div><Field label="Phone number" type="tel" autoComplete="tel" hint="Changing your phone requires verification again." error={errors.phone?.message} {...register('phone')} /><Field label="Profile photo" id="profile-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hint="JPEG, PNG, WebP or GIF, up to 5 MB." />{profile.phone && <p className="text-xs text-neutral-600">Phone verification: <strong>{profile.isPhoneVerified ? 'Verified' : 'Not verified'}</strong>. <Link to="/app/security" className="font-bold underline decoration-lime-500 underline-offset-4">Manage verification</Link></p>}<div className="border-t border-neutral-200 pt-5"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save profile'}</Button></div></form>
  </div></div>;
}

