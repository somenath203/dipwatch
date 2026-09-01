"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import AuthModal from "./AuthModal";
import { signOutUser } from "../actions";


const AuthButton = ({ currentlyLoggedInUserDetails }) => {
    
  const [showAuthDialogModal, setShowAuthDialogModal] = useState(false);

  // If the details of the user is available, that means the user is logged in, so, in that case, display 'logout' button instead
  // of log-in button.
  if (currentlyLoggedInUserDetails) {
    return (
      <form action={signOutUser}>

        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="gap-2 hover:cursor-pointer"
        >
            <LogOut className="w-4 h-4" />
            Sign Out

        </Button>

      </form>
    );
  }

  return (
    <>

      <Button
        onClick={() => setShowAuthDialogModal(true)}
        variant="default"
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 hover:cursor-pointer gap-2"
      >
        {/* 'Login' is the icon imported from lucide-react */}
        <LogIn className="size-4" /> Sign In{" "}
      </Button>

      <AuthModal isOpenAuthDialog={showAuthDialogModal} onCloseAuthDialog={() => setShowAuthDialogModal(false)} />

    </>
  );
};

export default AuthButton;
