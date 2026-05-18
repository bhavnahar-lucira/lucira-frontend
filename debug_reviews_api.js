async function debug() {
  try {
    const res = await fetch('http://localhost:3000/api/reviews/list?limit=10');
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Body:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}
debug();
