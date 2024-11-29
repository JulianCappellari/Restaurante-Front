import { LoginForm } from "./ui/LoginForm";





export default function Login() {
  return (
    <div className="flex flex-col min-h-screen pt-32 sm:pt-25 items-center">

      <h1 className={ ` text-4xl mb-5` }>Ingresar</h1>
        <LoginForm />
      
    </div>
  );
}