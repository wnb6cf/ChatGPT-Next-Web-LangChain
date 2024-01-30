import fetch from "node-fetch";
import fs from "fs/promises";

const RAW_FILE_URL = "https://raw.githubusercontent.com/";
const MIRRORF_FILE_URL = "http://raw.fgit.ml/";

const RAW_CN_URL = "PlexPt/awesome-chatgpt-prompts-zh/main/prompts-zh.json";
const CN_URL = MIRRORF_FILE_URL + RAW_CN_URL;
const RAW_EN_URL = "f/awesome-chatgpt-prompts/main/prompts.csv";
const EN_URL = MIRRORF_FILE_URL + RAW_EN_URL;
const FILE = "./public/prompts.json";

const ignoreWords = ["涩涩", "魅魔"];

const timeoutPromise = (timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Request timeout"));
    }, timeout);
  });
};

async function fetchCN() {
  console.log("[Fetch] fetching cn prompts...");
  try {
    const response = await Promise.race([fetch(CN_URL), timeoutPromise(5000)]);
    const raw = await response.json();
    return raw
      .map((v) => [v.act, v.prompt])
      .filter(
        (v) =>
          v[0] &&
          v[1] &&
          ignoreWords.every((w) => !v[0].includes(w) && !v[1].includes(w)),
      );
  } catch (error) {
    console.error("[Fetch] failed to fetch cn prompts", error);
    return [];
  }
}

async function fetchEN() {
  console.log("[Fetch] fetching en prompts...");
  try {
    // const raw = await (await fetch(EN_URL)).text();
    const response = await Promise.race([fetch(EN_URL), timeoutPromise(5000)]);
    const raw = await response.text();
    return raw
      .split("\n")
      .slice(1)
      .map((v) =>
        v
          .split('","')
          .map((v) => v.replace(/^"|"$/g, "").replaceAll('""', '"'))
          .filter((v) => v[0] && v[1]),
      );
  } catch (error) {
    console.error("[Fetch] failed to fetch en prompts", error);
    return [
      ["字数未达到要求，立即一键续写", "Please continue to supplement the content you replied to above. There is no need to start from scratch, just continue to supplement the content at the end, in Chinese"],
      ["一键翻译", "Please translate the last content you gave me (just translate it directly, without too much explanation)"],
      ["一键总结", "Please summarize this sentence"],
      ["文章一键精简", "Shorten it！"],
      ["文章一键扩写", "Expand it！"],
      ["文章一键润色", "Refine the paragraph above to make it more logical and academic, using Chinese"],
      ["文章快捷配图", "Please insert appropriate pictures that match the content of the article based on your answer above, and then send me the pictures you want to insert. The article content is no longer needed, please reply in Chinese. When you need to send pictures, please use markdown language to generate them, without Backslash or code box. When you need to use the unsplash API, follow the format below, https://source.unsplash.com/960x640/? Do not use code blocks for English keywords. Once you understand, reply and receive"],
    ];
  }
}


async function main() {
  Promise.all([fetchCN(), fetchEN()])
    .then(([cn, en]) => {
      fs.writeFile(FILE, JSON.stringify({ cn, en }));
    })
    .catch((e) => {
      console.error("[Fetch] failed to fetch prompts");
      fs.writeFile(FILE, JSON.stringify({ cn: [], en: [] }));
    })
    .finally(() => {
      console.log("[Fetch] saved to " + FILE);
    });
}

main();
