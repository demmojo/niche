async function run() {
  const response = await fetch("https://httpbin.org/status/404");
  const text1 = await response.text();
  console.log("first text length:", text1.length);
  try {
    const text2 = await response.text();
    console.log("second text length:", text2.length);
  } catch (e) {
    console.error("Error on second text:", e.message);
  }
}
run();
