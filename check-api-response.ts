async function checkAPI() {
  console.log('=== Checking API response ===\n');
  
  const res = await fetch('http://localhost:3000/api/merchandise-category?all=true');
  const data = await res.json();
  
  console.log('API Response:');
  console.log(JSON.stringify(data, null, 2));
}

checkAPI().catch(console.error);
