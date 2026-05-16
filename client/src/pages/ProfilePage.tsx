import { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Pencil
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuthStore } from "../store/authStore";
import { updateProfile, uploadAvatar } from "../services/userApi";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "../components/ui/avatar";

const schema = z.object({
  name: z.string().min(2),
  bio: z.string().max(160).optional()
});

type FormValues = z.infer<typeof schema>;

const settingsItems = [
  "Account",
  "Privacy",
  "Notifications",
  "Chats",
  "Data & Storage",
  "Help",
  "About"
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("Account");
  const [mobilePage, setMobilePage] = useState<null | string>(null);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const displayUsername = user?.username
    ? user.username.startsWith("@")
      ? user.username
      : `@${user.username}`
    : "@username";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const updated = await updateProfile(values);

      updateUser(updated);

      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const updated = await uploadAvatar(file);

      updateUser(updated);

      toast.success("Avatar updated");
    } catch (error) {
      toast.error("Failed to upload avatar");
    }
  };

  const renderAccountContent = () => (
    <div className="rounded-[28px] border border-[#F3DFA5] bg-white p-4 sm:p-5 md:p-8">
      <div className="hidden items-center justify-between border-b border-[#F7E8BA] pb-6 md:flex">
        <h3 className="text-2xl font-semibold text-black">
          Profile Photo
        </h3>

        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border border-[#F4D57B]">
            <AvatarImage src={user?.avatar?.url} />

            <AvatarFallback>
              {user?.name?.slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="cursor-pointer rounded-2xl border border-[#F0CC69] px-5 py-3 text-base font-medium text-[#D99800] transition hover:bg-[#FFF7DB]">
              Change Photo
            </div>
          </label>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-2 space-y-7 md:mt-8"
      >
        <div className="border-b border-[#F8EAC0] pb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-lg font-semibold text-black">
              Full Name
            </label>

            <Pencil className="h-4 w-4 text-neutral-400" />
          </div>

          <Input
            {...register("name")}
            className="h-14 rounded-2xl border-[#F2DFAB] bg-[#FFFDF8] text-lg focus-visible:ring-[#E8BE47]"
          />

          {errors.name && (
            <p className="mt-2 text-sm text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="border-b border-[#F8EAC0] pb-6">
          <label className="mb-3 block text-lg font-semibold text-black">
            Email Address
          </label>

          <Input
            value={user?.email || ""}
            disabled
            className="h-14 rounded-2xl border-[#F2DFAB] bg-[#FFF8E7] text-lg text-neutral-500"
          />
        </div>

        <div className="border-b border-[#F8EAC0] pb-6">
          <label className="mb-3 block text-lg font-semibold text-black">
            Username
          </label>

          <Input
            value={displayUsername}
            disabled
            className="h-14 rounded-2xl border-[#F2DFAB] bg-[#FFF8E7] text-lg text-neutral-500"
          />
        </div>

        <div className="border-b border-[#F8EAC0] pb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-lg font-semibold text-black">
              Bio
            </label>

            <Pencil className="h-4 w-4 text-neutral-400" />
          </div>

          <Textarea
            rows={5}
            {...register("bio")}
            className="rounded-2xl border-[#F2DFAB] bg-[#FFFDF8] text-base focus-visible:ring-[#E8BE47]"
          />

          {errors.bio && (
            <p className="mt-2 text-sm text-red-500">
              {errors.bio.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-14 rounded-2xl bg-[#E3A300] px-8 text-base font-semibold text-white hover:bg-[#CA9200]"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="rounded-[28px] border border-[#F3DFA5] bg-white p-10">
      <h2 className="text-3xl font-bold text-black">
        {title}
      </h2>

      <p className="mt-3 text-neutral-500">
        {title} settings content goes here.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      {/* MOBILE */}

      <div className="md:hidden">
        {!mobilePage ? (
          <div className="p-4">
            <div className="flex items-center gap-4">
              <ChevronLeft className="h-8 w-8 text-[#D99800]" />

              <h1 className="text-4xl font-bold text-black">
                Settings
              </h1>
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-[#FFE08A]">
                    <AvatarImage src={user?.avatar?.url} />

                    <AvatarFallback>
                      {user?.name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>

                  <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white shadow">
                    <Camera className="h-4 w-4 text-[#D99800]" />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {user?.name}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-400">
                    {displayUsername}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                className="h-12 rounded-2xl border border-[#EAC867] bg-[#FFF8E1] px-5 text-[#D99800] hover:bg-[#FFF1C7]"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="mt-8 rounded-[32px] border border-[#F3DFA5] bg-white">
              {settingsItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setMobilePage(item)}
                  className="flex w-full items-center justify-between border-b border-[#F8EAC0] px-5 py-6 text-left last:border-none"
                >
                  <span className="text-2xl font-medium text-black">
                    {item}
                  </span>

                  <ChevronRight className="h-6 w-6 text-neutral-400" />
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[32px] border border-[#F3E3B2] bg-[#FFF8E8] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-[#D99800]">
                    Log out
                  </h3>

                  <p className="mt-1 text-neutral-500">
                    Sign out from your account
                  </p>
                </div>

                <ChevronRight className="h-6 w-6 text-[#D99800]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => setMobilePage(null)}
              className="flex items-center gap-3"
            >
              <ChevronLeft className="h-8 w-8 text-[#D99800]" />

              <h1 className="text-4xl font-bold text-black">
                {mobilePage}
              </h1>
            </button>

            <div className="mt-8">
              {mobilePage === "Account"
                ? renderAccountContent()
                : renderPlaceholder(mobilePage)}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP */}

      <div className="hidden min-h-screen md:flex">
        <aside className="w-[320px] shrink-0 border-r border-[#F6E7BB] bg-[#FFFBEF] p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-[#FFE08A]">
                <AvatarImage src={user?.avatar?.url} />

                <AvatarFallback>
                  {user?.name?.slice(0, 1)}
                </AvatarFallback>
              </Avatar>

              <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#F3D47A] bg-white shadow-sm">
                <Camera className="h-5 w-5 text-[#D99800]" />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-black">
              {user?.name}
            </h2>

            <p className="mt-1 text-base text-neutral-500">
              {displayUsername}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {settingsItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition-all ${activeTab === item
                  ? "bg-[#FFE89A] text-[#B77900]"
                  : "hover:bg-[#FFF4D1]"
                  }`}
              >
                <span className="text-lg font-medium">
                  {item}
                </span>

                <ChevronRight className="h-5 w-5 text-neutral-500" />
              </button>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-[#F3E3B2] bg-[#FFF8E8] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-[#D99800]">
                  Log out
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  Sign out from your account
                </p>
              </div>

              <ChevronRight className="mt-1 h-5 w-5 text-[#D99800]" />
            </div>
          </div>
        </aside>

        <main className="flex-1 p-10">
          <h1 className="text-4xl font-bold text-black">
            Settings
          </h1>

          <div className="mt-8">
            <h2 className="text-3xl font-bold text-black">
              {activeTab}
            </h2>

            <p className="mt-2 text-lg text-neutral-500">
              Manage your account information and preferences.
            </p>
          </div>

          <div className="mt-8">
            {activeTab === "Account"
              ? renderAccountContent()
              : renderPlaceholder(activeTab)}
          </div>
        </main>
      </div>
    </div>
  );
};

export { ProfilePage };