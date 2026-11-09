import type { Metadata } from "next";
import WeatherApp from "@/components/weather/WeatherApp";

export const metadata: Metadata = { title: "Weather" };

export default function WeatherPage() {
  return <WeatherApp />;
}
