"use client";

import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

import { getPriceHistoryOfAParticularProduct } from "../actions";


const PriceHistoryTrackChart = ({ idOfTheProductWHosePriceHistoryIsToBeTracked }) => {

  const [priceTrackHistoricalData, setPriceTrackHistoricalData] = useState([]);

  const [loadingPriceTrackHistoricalData, setLoadingPriceTrackHistoricalData] = useState(true);

  // loading the price tracking historical data
  useEffect(() => {

    async function loadHistoricalChartData() {

      try {

        setLoadingPriceTrackHistoricalData(true);

        const res = await getPriceHistoryOfAParticularProduct(
          idOfTheProductWHosePriceHistoryIsToBeTracked,
        );

        // Convert the raw price-history records returned from the server into
        // a simpler array of objects containing the date when the price was checked
        // and the corresponding price. This format will be used as the data source
        // for the Recharts line chart.
        const trackPriceHistoryData = res?.map((item) => ({
          date: new Date(item?.checked_at).toLocaleDateString(),
          price: parseFloat(item?.price_of_the_product),
        }));

        setPriceTrackHistoricalData(trackPriceHistoryData);

      } catch (error) {

        console.log(error);

      } finally {

        setLoadingPriceTrackHistoricalData(false);

      }

    }

    loadHistoricalChartData();

  }, [idOfTheProductWHosePriceHistoryIsToBeTracked]);


   if (loadingPriceTrackHistoricalData) {

    return (
      <div className="flex items-center justify-center py-8 text-gray-500 w-full">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading chart...
      </div>
    );

  }

  if (priceTrackHistoricalData?.length === 0) {

    return (
      <div className="text-center py-8 text-gray-500 w-full">
        No price history yet. Check back after the first daily update!
      </div>
    );
    
  }

  return (
    <div className="w-full">

      <h4 className="text-sm font-semibold mb-4 text-gray-700">Price History</h4>

      <ResponsiveContainer width="100%" height={200}>

        <LineChart data={priceTrackHistoricalData}>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />

          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke="#FA5D19"
            strokeWidth={2}
            dot={{ fill: "#FA5D19", r: 4 }}
            activeDot={{ r: 6 }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  )
};

export default PriceHistoryTrackChart;
