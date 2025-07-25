export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900">Tailwind CSS Test</h1>
        <p className="mt-4 text-gray-600">If you see this styled correctly, Tailwind is working!</p>
        <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Test Button
        </button>
      </div>
    </div>
  );
}
