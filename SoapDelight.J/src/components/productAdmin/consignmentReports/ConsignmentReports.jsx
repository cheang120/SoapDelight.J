import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import inventoryService from "../inventory/inventoryService";
import consignmentReportService from "./consignmentReportService";
import "./ConsignmentReports.scss";

const ConsignmentReports = () => {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationData, productData, reportData] = await Promise.all([
        inventoryService.getLocations(),
        inventoryService.getInventoryOverview(),
        consignmentReportService.getConsignmentReports(),
      ]);

      setLocations(Array.isArray(locationData) ? locationData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load consignment reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="consignment-reports">
      <header className="consignment-reports__header">
        <div>
          <p className="consignment-reports__eyebrow">Consignment</p>
          <h2>Consignment Sales Reports / 寄賣銷售回報</h2>
          <p>PDF and invoice generation will be added later after you provide the document style.</p>
        </div>

        <button type="button" onClick={loadData} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      </header>

      <div className="consignment-reports__card">
        <p>Consignment locations: {locations.filter((item) => item.type === "consignment").length}</p>
        <p>Products loaded: {products.length}</p>
        <p>Reports loaded: {reports.length}</p>
      </div>
    </section>
  );
};

export default ConsignmentReports;
