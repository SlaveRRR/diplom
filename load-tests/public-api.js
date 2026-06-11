import http from "k6/http";
import { check, sleep, group } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const comicId = __ENV.COMIC_ID || "1";
const postId = __ENV.POST_ID || "1";
const profile = __ENV.LOAD_PROFILE || "smoke";

const profileStages = {
  smoke: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 5 },
    { duration: "30s", target: 0 },
  ],
  load: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "1m", target: 0 },
  ],
  stress: [
    { duration: "1m", target: 20 },
    { duration: "2m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "1m", target: 0 },
  ],
  soak: [
    { duration: "1m", target: 10 },
    { duration: "30m", target: 10 },
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
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
};

function assertOk(response, label) {
  check(response, {
    [`${label} status is 200`]: (r) => r.status === 200,
    [`${label} body is not empty`]: (r) => Boolean(r.body),
  });
}

export default function () {
  group("public api: home", () => {
    const response = http.get(`${baseUrl}/api/v1/home/`, {
      tags: { scope: "public-api", route: "home" },
    });
    assertOk(response, "home api");
  });

  group("public api: catalog", () => {
    const response = http.get(
      `${baseUrl}/api/v1/comics/?page=1&page_size=12&sort=popular`,
      {
        tags: { scope: "public-api", route: "catalog" },
      },
    );
    assertOk(response, "catalog api");
  });

  group("public api: comic details", () => {
    const response = http.get(`${baseUrl}/api/v1/comics/${comicId}/`, {
      tags: { scope: "public-api", route: "comic-details" },
    });
    assertOk(response, "comic details api");
  });

  group("public api: blog post", () => {
    const response = http.get(`${baseUrl}/api/v1/posts/${postId}/`, {
      tags: { scope: "public-api", route: "blog-post" },
    });
    assertOk(response, "blog post api");
  });

  sleep(thinkTime);
}
