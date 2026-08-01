import ProductHeader from "../components/ProductHeader";
import CalibrationClient from "./calibration-client";

export default function CalibrationPage() {
  return <main className="app-shell calibration-page">
    <ProductHeader />
    <CalibrationClient />
  </main>;
}
