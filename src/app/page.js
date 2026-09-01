import { Rabbit, Shield, Bell, TrendingDown } from "lucide-react";
import Link from "next/link";

import AddProductForm from "./_components/AddProductForm";
import AuthButton from "./_components/AuthButton";
import { createClient } from "@/lib/supabase/server";


const FEATURES = [
  {
    icon: Rabbit,
    title: "Lightning Fast",
    description:
      "Deal Drop extracts prices in seconds, handling JavaScript and dynamic content",
  },
  {
    icon: Shield,
    title: "Always Reliable",
    description:
      "Works across all major e-commerce sites with built-in anti-bot protection",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified instantly when prices drop below your target",
  },
];


const Page = async () => {

  const supabaseClient = await createClient();

  const {data: { user }} = await supabaseClient?.auth?.getUser();


  const allProductsScrapedByTheCurrentlyLoggedInUser = [];

  return (
    <main className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">

      {/* header section */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">

        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">

          <Link
            href="/"
            className="text-xl font-semibold tracking-wide select-none"
          >
            Dip<span className="font-bold text-orange-500">Watch</span>
          </Link>

          <AuthButton currentlyLoggedInUserDetails={user} />

        </div>

      </header>

      {/* hero section */}
      <section className="py-20 px-4">

        <div className="max-w-7xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-2 rounded-full text-sm font-medium mb-6">
            Made with 💖 by Somenath Choudhury
          </div>

          <h2 className="text-5xl font-bold text-gray-900 tracking-tight">Never miss a Price Drop</h2>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">Track prices from any e-commerce site. Get instant alerts when prices drop. Save money effortlessly.</p>

          {/* product form */}
          <AddProductForm user={user} />

          {/* features */}
          {allProductsScrapedByTheCurrentlyLoggedInUser?.length === 0 && (

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">

              {/* Displaying feature information as placeholder content when there are no products */}
              {FEATURES?.map(({ icon: Icon, title, description }) => (

                <div key={title} className="bg-white p-6 rounded-xl border border-gray-200">

                  <div className="size-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">

                    <Icon className="size-6 text-orange-500" />

                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>

                  <p className="text-sm text-gray-600">{description}</p>

                </div>

              ))}

            </div>
          )}

        </div>

      </section>

      {user && allProductsScrapedByTheCurrentlyLoggedInUser?.length === 0 && (

        // The below 'section' will be displayed when the currently authenticated user has not tracked any products.

        <section className="max-w-2xl mx-auto px-4 pb-20 text-center">

          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">

            <TrendingDown className="w-16 h-16 text-gray-400 mx-auto mb-4" />

            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>

            <p className="text-gray-600">Add your first product above to start tracking prices!</p>

          </div>

        </section>

      )}

    </main>
  );
};

export default Page;
