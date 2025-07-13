export default function HealthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Health Check</h1>
      <p>If you can see this page, the app is running correctly.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}