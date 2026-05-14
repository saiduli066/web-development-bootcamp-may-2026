import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../store/authStore";
import { loginSchema } from "../features/auth/validators";

type FormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values);
      navigate("/chat");
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          toast.error("Wrong credentials");
          return;
        }
        const message = error.response?.data?.message;
        toast.error(message ?? "Network error. Please try again.");
        return;
      }
      toast.error("Unable to sign in");
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1a1a]">
            Sign in
          </h1>
          <p className="text-sm text-[#8a8a8a]">
            Welcome back. Let’s get you connected.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1a1a1a]">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              error={!!errors.email}
              className="h-12 rounded-2xl border-[#e6e6e6] bg-white px-4 text-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1a1a1a]">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                error={!!errors.password}
                className="h-12 rounded-2xl border-[#e6e6e6] bg-white px-4 pr-12 text-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#1a1a1a]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl bg-[#1d1d1d] text-base font-semibold text-white shadow-lg shadow-black/20 hover:bg-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-[#7a7a7a]">
          Don’t have an account?{" "}
          <Link className="font-semibold text-[#1d1d1d]" to="/register">
            Sign up here.
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export { LoginPage };
