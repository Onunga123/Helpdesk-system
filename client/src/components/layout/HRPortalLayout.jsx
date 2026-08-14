import { Outlet } from "react-router-dom";
import "./HRPortal.css";

const HRPortalLayout = () => (
  <div className="hr-portal-content">
    <Outlet />
  </div>
);

export default HRPortalLayout;
