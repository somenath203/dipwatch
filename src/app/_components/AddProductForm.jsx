"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthModal from "./AuthModal";
import { addOrUpdateScrapedProduct } from "../actions";


const AddProductForm = ({ user }) => {

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [urlInput, setUrlInput] = useState("");

  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // If user is not logged in, then, show the 'auth modal'
      if(!user) {

        setShowAuthModal(true);

        return;

      }

      setLoading(true);

      const formData = new FormData();

      formData.append("urlOfTheWebsiteThatIsToBeScraped", urlInput);


      const res = await addOrUpdateScrapedProduct(formData);

      if (res?.error) {

        toast.error(res?.error);

      } else {

        toast.success(res?.message || 'Product tracked successfully');

        setUrlInput('');

      }

    } catch (error) {

      console.log(error);

      toast.error("Something went wrong. Please try again after sometime.");

    } finally {

      setLoading(false);

    }

  };

  return (
    <>
      <form className="w-full max-w-2xl mx-auto" onSubmit={handleSubmit}>

        <div className="flex flex-col sm:flex-row gap-2">

          <Input
            type="url"
            placeholder="paste product URL (Amazon, Walmart, etc.)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="h-12 text-base border-2"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 h-10 sm:h-12 px-8 hover:cursor-pointer"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin duration-150" />
            ) : (
              "Track Price"
            )}
          </Button>

        </div>

      </form>

      {/* authentication modal */}
      <AuthModal isOpenAuthDialog={showAuthModal} onCloseAuthDialog={() => setShowAuthModal(false)} />
      
    </>
  );
};

export default AddProductForm;
