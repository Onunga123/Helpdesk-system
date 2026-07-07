import './PageLoader.css';

const PageLoader = ({ label = 'Loading page...' }) => (
  <div className="page-loader" role="status" aria-live="polite" aria-label={label}>
    <div className="page-loader-skeleton page-loader-header" />
    <div className="page-loader-grid">
      <div className="page-loader-skeleton page-loader-card" />
      <div className="page-loader-skeleton page-loader-card" />
      <div className="page-loader-skeleton page-loader-card" />
      <div className="page-loader-skeleton page-loader-card" />
    </div>
    <div className="page-loader-skeleton page-loader-panel" />
    <p className="page-loader-label">{label}</p>
  </div>
);

export default PageLoader;
