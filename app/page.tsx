'use client'
import { redirect } from "next/navigation";

export default function Home() {
  return (
     <div>
      this is home
      <button onClick={()=>{redirect('/auth/signup')}}>Click</button>
     </div>
  );
}
