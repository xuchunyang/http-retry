const axios = require("axios");

// 算 https://github.com/axios/axios#handling-errors
test("什么情况算 error? 404 算吗？", async () => {
  expect.assertions(1);
  try {
    await axios.get("http://example.com/404");
  } catch (error) {
    expect(error.response.status).toBe(404);
    console.log("HEADERS:", error.response.headers);
  }
});

// 算 https://github.com/axios/axios#handling-errors
test("error match body", async () => {
  expect.assertions(1);
  try {
    await axios.get("https://frp.cadr.xyz/");
  } catch (error) {
    expect(error.response.data).toMatch("Faithfully yours, frp");
  }
});
