'use client'

import { useState } from "react"
import SignIn from "./signin/page";
import SignUp from "./signup/page";

export default function(){
    const [isLogin,setIsLogin] = useState(false);
    return (
        <div>
            {isLogin?<>{SignIn}</>:<>{SignUp}</>}
            <p>Already a user <button type="button" onClick={()=>{setIsLogin(true)}}>Login</button></p>
        </div>
    )
}