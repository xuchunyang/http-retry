const express = require("express");
const debug = require("debug")("retry");
const morgan = require("morgan");
const axios = require("axios");

const app = express();
app.use(morgan("dev"));

// TODO 重启 server 时保存 urls
const urls = [];

async function sendUrls() {
  debug("运行 sendUrls: url: %o", urls);
  let i = urls.length;
  while (i--) {
    const url = urls[i];
    try {
      const response = await axios.get(url);
      console.log(
        `请求 ${url} 返回状态 ${response.status}，内容 ${response.data}`
      );
    } catch (error) {
      if (isEmacsDown(error)) {
        debug("Emacs 离线，等会儿再试！");
        break;
      }
      debug(error);
      console.log(`请求 ${url} 出错 ${error.message}`);
    }
    debug("已经处理了 ${url}，删除它");
    urls.splice(i, 1);
  }
  debug("计划下次运行 sendUrls: url: %o", urls);
  setTimeout(sendUrls, 60 * 1000);
}

// setTimeout(sendUrls, 15 * 60 * 1000);
setTimeout(sendUrls, 60 * 1000);

// debug
app.get("/urls", (req, res) => {
  res.json(urls);
});

function isEmacsDown(error) {
  return (
    error.response &&
    error.response.data &&
    error.response.data.includes("Faithfully yours, frp")
  );
}

app.get("/", async (req, res) => {
  debug(req.url, req.path, req.query);
  const url = "https://frp.cadr.xyz" + req.url;
  debug("Handling %s...", url);
  try {
    const response = await axios.get(url);
    res.status(response.status).set(response.headers).send(response.data);
    return;
  } catch (error) {
    if (isEmacsDown(error)) {
      urls.push(url);
      debug("Emacs 离线！");
      res.send("Emacs 离线！你的请求已经被缓存，过一段时间会自动重试");
      return;
    }
    if (error.response) {
      res.status(error.status).set(error.headers).send(error.data);
      return;
    }
    if (error.request) {
      debug("该请求没有回复: %o", error.request);
      res.send("该请求没有回复: " + error.request.url);
      return;
    }
    res.send("该请求有问题: " + error.message);
  }
});

const server = app.listen(
  process.env.PORT || 3000,
  process.env.HOST || "localhost",
  () => {
    const { address, port } = server.address();
    console.log(`Listening at http://${address}:${port}/`);
  }
);
