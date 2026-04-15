import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  createReflection,
  deleteReflection,
  listReflections,
  updateReflection,
  validateReflectionContent,
} from "@/services/reflectionService";

function makeQuery(overrides?: Partial<Record<string, unknown>>) {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    ...overrides,
  };
}

describe("reflectionService", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  describe("validateReflectionContent", () => {
    it("rejects empty content", () => {
      expect(validateReflectionContent("   ").ok).toBe(false);
    });

    it("trims valid content", () => {
      const v = validateReflectionContent("  hello  ");
      expect(v.ok).toBe(true);
      if (v.ok) expect(v.value).toBe("hello");
    });
  });

  it("lists reflections for a user", async () => {
    const q = makeQuery();
    q.select.mockReturnValue(q);
    q.eq.mockReturnValue(q);
    q.order.mockResolvedValue({ data: [{ id: "1" }], error: null });

    fromMock.mockReturnValue(q);

    const result = await listReflections("user-1");
    expect(fromMock).toHaveBeenCalledWith("reflections");
    expect(q.select).toHaveBeenCalled();
    expect(q.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(q.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual([{ id: "1" }]);
  });

  it("creates a reflection with validated content", async () => {
    const q = makeQuery();
    q.insert.mockReturnValue(q);
    q.select.mockReturnValue(q);
    q.single.mockResolvedValue({ data: { id: "r1", content: "hello" }, error: null });
    fromMock.mockReturnValue(q);

    const created = await createReflection({ userId: "user-1", content: "  hello  " });
    expect(q.insert).toHaveBeenCalledWith({ user_id: "user-1", content: "hello" });
    expect(created).toEqual({ id: "r1", content: "hello" });
  });

  it("throws on create when content is empty", async () => {
    await expect(createReflection({ userId: "user-1", content: " " })).rejects.toThrow(
      "Reflection cannot be empty.",
    );
  });

  it("updates a reflection only within user scope", async () => {
    const q = makeQuery();
    q.update.mockReturnValue(q);
    q.eq.mockReturnValue(q);
    q.select.mockReturnValue(q);
    q.single.mockResolvedValue({ data: { id: "r1", content: "updated" }, error: null });
    fromMock.mockReturnValue(q);

    const updated = await updateReflection({ userId: "user-1", id: "r1", content: "updated" });
    expect(q.eq).toHaveBeenCalledWith("id", "r1");
    expect(q.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(updated).toEqual({ id: "r1", content: "updated" });
  });

  it("deletes a reflection only within user scope", async () => {
    const q = makeQuery();
    q.delete.mockReturnValue(q);
    q.eq.mockReturnValueOnce(q).mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValue(q);

    await deleteReflection({ userId: "user-1", id: "r1" });
    expect(q.eq).toHaveBeenCalledWith("id", "r1");
    expect(q.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("propagates supabase errors", async () => {
    const q = makeQuery();
    q.select.mockReturnValue(q);
    q.eq.mockReturnValue(q);
    q.order.mockResolvedValue({ data: null, error: new Error("denied") });
    fromMock.mockReturnValue(q);

    await expect(listReflections("user-1")).rejects.toThrow("denied");
  });
});

