const fetch = require('node-fetch');
(async () => {
  const res = await fetch("http://localhost:3000/api/campaign/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer MOCK_TOKEN",
    },
    body: JSON.stringify({ baseIdea: {name: "test"} }),
  });
  console.log(res.status);
  console.log(await res.text());
})();
