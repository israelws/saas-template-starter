export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '24px' }}>Test Page</h1>
      <p style={{ color: 'black' }}>If you can see this, the Next.js app is working.</p>
      <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>Go to Login</a>
    </div>
  );
}