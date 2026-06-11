import http from "k6/http";
import { check, sleep, group } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const comicId = __ENV.COMIC_ID || "1";
const postId = __ENV.POST_ID || "1";
const profile = __ENV.LOAD_PROFILE || "smoke";

const profileStages = {
  smoke: [
    { duration: "30s", target: 3 },
    { duration: "1m", target: 3 },
    { duration: "30s", target: 0 },
  ],
  load: [
    { duration: "1m", target: 10 },
    { duration: "3m", target: 10 },
    { duration: "1m", target: 0 },
  ],
  stress: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "2m", target: 2000 },
    { duration: "1m", target: 0 },
  ],
  soak: [
    { duration: "1m", target: 5 },
    { duration: "30m", target: 5 },
    { duration: "1m", target: 0 },
  ],
};

const customStages = __ENV.MAX_VUS
  ? [
      {
        duration: __ENV.RAMP_UP_DURATION || "30s",
        target: Number(__ENV.MAX_VUS),
      },
      { duration: __ENV.HOLD_DURATION || "2m", target: Number(__ENV.MAX_VUS) },
      { duration: __ENV.RAMP_DOWN_DURATION || "30s", target: 0 },
    ]
  : null;

const stages = customStages || profileStages[profile] || profileStages.smoke;
const thinkTime = Number(__ENV.THINK_TIME || "1");

export const options = {
  stages,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
    checks: ["rate>0.99"],
  },
};

function assertPage(response, label) {
  check(response, {
    [`${label} status is 200`]: (r) => r.status === 200,
    [`${label} contains html`]: (r) =>
      String(r.body || "").includes("<!doctype html") ||
      String(r.body || "").includes("<html"),
  });
}

export default function () {
  group("public page: home", () => {
    const response = http.get(`${baseUrl}/`, {
      tags: { scope: "public-page", route: "home" },
    });
    assertPage(response, "home page");
  });

  group("public page: catalog", () => {
    const response = http.get(`${baseUrl}/catalog`, {
      tags: { scope: "public-page", route: "catalog" },
    });
    assertPage(response, "catalog page");
  });

  group("public page: blog", () => {
    const response = http.get(`${baseUrl}/blog`, {
      tags: { scope: "public-page", route: "blog" },
    });
    assertPage(response, "blog page");
  });

  group("public page: comic details", () => {
    const response = http.get(`${baseUrl}/comics/${comicId}`, {
      tags: { scope: "public-page", route: "comic-details" },
    });
    assertPage(response, "comic details page");
  });

  group("public page: blog post", () => {
    const response = http.get(`${baseUrl}/blog/${postId}`, {
      tags: { scope: "public-page", route: "blog-post" },
    });
    assertPage(response, "blog post page");
  });

  sleep(thinkTime);
}
