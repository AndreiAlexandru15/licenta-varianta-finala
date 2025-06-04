"use client";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    
     <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl">
        <LoginForm />
    </div>
     </div>
  );
}
