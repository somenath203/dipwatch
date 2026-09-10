"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  TrendingDown,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Trash2,
  ImageOff,
} from "lucide-react";
import Link from "next/link";

import { deleteProduct } from "../actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PriceHistoryTrackChart from "./PriceHistoryTrackChart";


const ProductCard = ({ product }) => {

  const [showPriceTrackingChart, setShowPriceTrackingChart] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(false);

  const imageUrlOfTheProduct = product?.image_url_of_the_scraped_product;

  const isValidProductImage = imageUrlOfTheProduct && !imageUrlOfTheProduct?.toLowerCase()?.endsWith("transparent-background.png");


  const handleDeleteProduct = async () => {

    try {

      setDeletingProduct(true);

      const res = await deleteProduct(product?.id);

      if (res?.error) {

        toast.error(res?.error);

      } else {

        toast.success(res?.message || "Product deleted successfully");

      }

    } catch (error) {

      console.log(error);

      toast.error("Something went wrong");

    } finally {

      setDeletingProduct(false);

    }

  };


  return (
    <Card className="hover:shadow-lg transition-shadow">

      <CardHeader className="pb-3">

        <div className="flex gap-4">

          {isValidProductImage ? (
            <Image
              src={product?.image_url_of_the_scraped_product}
              alt="product image"
              width={80}
              height={80}
              className="object-cover rounded-md border"
            />
          ) : (
            <ImageOff className="w-8 h-8 text-gray-400" />
          )}

          <div className="flex-1 min-w-0">

            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {product?.full_name_of_the_product}
            </h3>

            <div className="flex items-baseline gap-2">

              <span className="text-3xl font-bold text-orange-500">
                {product?.currency}{" "}
                {product?.current_price_of_the_scraped_product}
              </span>

              <Badge variant="secondary" className="gap-1">
                <TrendingDown className="w-3 h-3" /> Tracking
              </Badge>

            </div>

          </div>

        </div>

      </CardHeader>

      <CardContent>

        <div className="flex flex-wrap gap-2">

          <Button
            className="hover:cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => setShowPriceTrackingChart(!showPriceTrackingChart)}
          >
            {showPriceTrackingChart ? (
              <>
                <ChevronUp className="w-4 h-4" /> Hide Chart
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Show Chart
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 hover:cursor-pointer"
            asChild
          >
            <Link href={product?.url_of_the_scraped_product} target="_blank">
              <ExternalLink className="w-4 h-4" /> View Product
            </Link>

          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteProduct}
            disabled={deletingProduct}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer gap-1"
          >
            <Trash2 className="w-4 h-4" /> Remove
          </Button>

        </div>

      </CardContent>

      {showPriceTrackingChart && (

        <CardFooter className="pt-0">

          <PriceHistoryTrackChart
            idOfTheProductWHosePriceHistoryIsToBeTracked={product?.id}
          />

        </CardFooter>
        
      )}

    </Card>
  );
};

export default ProductCard;
