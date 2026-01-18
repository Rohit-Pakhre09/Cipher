import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { resetPassword } from "../store/authSlice";
import AuthImagePattern from "../components/AuthImagePattern";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) navigate("/forgot-password");
  }, [token, navigate]);

  const onSubmit = async (data) => {
    try {
      await dispatch(resetPassword({ token, password: data.password })).unwrap();
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold">Reset password</h1>
            <p className="text-base-content/60">Set a new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <input type="password" className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`} {...register("password")} />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <input type="password" className={`input input-bordered w-full ${errors.confirm ? "input-error" : ""}`} {...register("confirm")} />
              {errors.confirm && <p className="text-red-500 text-sm mt-1">{errors.confirm.message}</p>}
            </div>

            <button className="btn btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>

      <AuthImagePattern title={"Set new password"} subtitle={"Create a secure new password for your account."} />
    </div>
  );
};

export default ResetPassword;
