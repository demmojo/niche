const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/  useEffect\(\(\) => \{\n    \/\/ Skip remote sync if mock_auth or demo mode/g, `  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("useLocalStorage useEffect running. URL:", window.location.href);
    }
    // Skip remote sync if mock_auth or demo mode`);

fs.writeFileSync('src/App.tsx', code);
