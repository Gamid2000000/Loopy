import { forumApi } from "./forumApi";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));
});

afterEach(() => vi.unstubAllGlobals());

it("uses the public forum endpoints with encoded parameters and abort signals", async () => {
  const controller = new AbortController();

  await forumApi.getForumCategories(controller.signal);
  await forumApi.getForumTopics("general / russian", 2, 10, controller.signal);
  await forumApi.getForumTopic(42, 3, 5, controller.signal);

  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/forum/categories", expect.objectContaining({ signal: controller.signal }));
  expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/forum/categories/general%20%2F%20russian/topics?page=2&size=10", expect.objectContaining({ signal: controller.signal }));
  expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/forum/topics/42?page=3&size=5", expect.objectContaining({ signal: controller.signal }));
});

it("sends each forum mutation once with the supplied JSON body", async () => {
  await forumApi.createForumTopic("general", { title: "A valid title", content: "A valid first message" });
  await forumApi.createForumPost(42, { content: "A valid reply message" });

  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/forum/categories/general/topics", expect.objectContaining({ method: "POST", body: JSON.stringify({ title: "A valid title", content: "A valid first message" }) }));
  expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/forum/topics/42/posts", expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "A valid reply message" }) }));
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("preserves forum API error codes and never retries a failed POST", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ code: "FORUM_TOPIC_LOCKED", message: "Locked", status: 409 }), { status: 409 }));

  await expect(forumApi.createForumPost(42, { content: "A valid reply message" })).rejects.toEqual(expect.objectContaining({ code: "FORUM_TOPIC_LOCKED", status: 409 }));
  expect(fetch).toHaveBeenCalledTimes(1);
});
