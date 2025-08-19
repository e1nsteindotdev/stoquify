import { SignInForm } from "./signIn-form";
import { SignUpForm } from "./signUp-form";
import { useState } from "react";

export function AuthForm({ className, ...props }: React.ComponentProps<"div">) {
  const [step, setStep] = useState('signIn')
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {step === "signUp" ?
        <SignUpForm step={step} setStep={setStep} />
        :
        <SignInForm step={step} setStep={setStep} />
      }
    </div>
  );
}


