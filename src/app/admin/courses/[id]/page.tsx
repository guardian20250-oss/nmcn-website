"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { LessonSection } from "@/lib/academy";

interface AdminLesson {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  order: number;
  sections: LessonSection[];
  questions: AdminQuestion[];
}

interface AdminQuestion {
  id?: number;
  prompt: string;
  type: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  status: string;
  passingScore: number;
  role: string;
}

export default function AdminCourseEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      const found = data.courses.find((c: CourseDetail) => c.id === courseId);
      if (!found) {
        router.push("/admin/courses");
        return;
      }
      setCourse({
        id: found.id,
        title: found.title,
        slug: found.slug,
        status: found.status,
        passingScore: found.passingScore,
        role: found.role || "creator",
      });

      const lessonRows: AdminLesson[] = [];
      for (const meta of found.lessons || []) {
        try {
          const full = await fetch(`/api/admin/lessons/${meta.id}`);
          if (full.ok) {
            const fd = await full.json();
            lessonRows.push({
              ...fd.lesson,
              sections: fd.lesson.sections || [],
              questions: fd.lesson.questions || [],
            });
            continue;
          }
        } catch {
          // fall through to meta-only row
        }
        lessonRows.push({
          id: meta.id,
          title: meta.title,
          slug: "",
          summary: null,
          status: meta.status,
          order: meta.order,
          sections: [],
          questions: [],
        });
      }
      setLessons(lessonRows);
    } catch {
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const addLesson = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        await load();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create lesson");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async (lesson: AdminLesson) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          sections: lesson.sections,
          status: lesson.status,
          order: lesson.order,
        }),
      });
      if (!res.ok) throw new Error("save failed");

      for (const q of lesson.questions) {
        if (q.id) {
          await fetch("/api/admin/questions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: q.id, ...q }),
          });
        } else {
          await fetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId: lesson.id, ...q }),
          });
        }
      }
      await load();
    } catch {
      setError("Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: number) => {
    if (!confirm("Delete lesson?")) return;
    await fetch("/api/admin/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const moveLesson = async (lesson: AdminLesson, dir: -1 | 1) => {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    const target = lessons[idx + dir];
    if (!target) return;
    await fetch("/api/admin/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lesson.id, order: target.order }),
    });
    await fetch("/api/admin/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: target.id, order: lesson.order }),
    });
    await load();
  };

  const updateLesson = (id: number, patch: Partial<AdminLesson>) => {
    setLessons((rows) =>
      rows.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const addSection = (lesson: AdminLesson, type: LessonSection["type"]) => {
    const section: LessonSection =
      type === "list"
        ? { type, items: [""] }
        : type === "image"
          ? { type, src: "", alt: "" }
          : type === "youtube"
            ? { type, videoUrl: "" }
            : { type, text: "" };
    updateLesson(lesson.id, { sections: [...lesson.sections, section] });
  };

  const updateSection = (
    lesson: AdminLesson,
    index: number,
    patch: Partial<LessonSection>
  ) => {
    const sections = lesson.sections.map((s, i) =>
      i === index ? { ...s, ...patch } : s
    );
    updateLesson(lesson.id, { sections });
  };

  const removeSection = (lesson: AdminLesson, index: number) => {
    updateLesson(lesson.id, {
      sections: lesson.sections.filter((_, i) => i !== index),
    });
  };

  const addQuestion = (lesson: AdminLesson) => {
    updateLesson(lesson.id, {
      questions: [
        ...lesson.questions,
        {
          prompt: "",
          type: "multiple_choice",
          options: ["", ""],
          correctIndex: 0,
          explanation: "",
        },
      ],
    });
  };

  const updateQuestion = (
    lesson: AdminLesson,
    index: number,
    patch: Partial<AdminQuestion>
  ) => {
    const questions = lesson.questions.map((q, i) =>
      i === index ? { ...q, ...patch } : q
    );
    updateLesson(lesson.id, { questions });
  };

  const removeQuestion = (lesson: AdminLesson, index: number) => {
    const q = lesson.questions[index];
    if (q.id) {
      fetch("/api/admin/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id }),
      });
    }
    updateLesson(lesson.id, {
      questions: lesson.questions.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin/courses"
              className="text-sm text-nmcn-muted hover:text-nmcn-blue"
            >
              ← Courses
            </Link>
            <h1 className="font-heading text-3xl font-bold text-white">
              {course?.title}
            </h1>
            <p className="text-nmcn-muted">
              /{course?.slug} · {lessons.length} lessons · pass{" "}
              {course?.passingScore}%
            </p>
          </div>
          <Link href="/admin" className="text-sm text-nmcn-muted hover:text-nmcn-blue">
            Dashboard
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="card mb-8 flex gap-3 p-4">
          <input
            className="input"
            placeholder="New lesson title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLesson()}
          />
          <button
            type="button"
            onClick={addLesson}
            disabled={saving}
            className="btn-gold disabled:opacity-50"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div key={lesson.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-sm font-bold text-nmcn-blue">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      className="input mb-1"
                      value={lesson.title}
                      onChange={(e) =>
                        updateLesson(lesson.id, { title: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Summary (optional)"
                      value={lesson.summary || ""}
                      onChange={(e) =>
                        updateLesson(lesson.id, { summary: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="input !w-auto"
                    value={lesson.status}
                    onChange={(e) =>
                      updateLesson(lesson.id, { status: e.target.value })
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                  <button
                    className="btn-ghost px-2 py-1.5 text-xs"
                    onClick={() => moveLesson(lesson, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    className="btn-ghost px-2 py-1.5 text-xs"
                    onClick={() => moveLesson(lesson, 1)}
                    disabled={index === lessons.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    className="btn-outline px-3 py-1.5 text-xs"
                    onClick={() =>
                      setExpandedId(expandedId === lesson.id ? null : lesson.id)
                    }
                  >
                    {expandedId === lesson.id ? "Close" : "Edit content"}
                  </button>
                  <button
                    className="btn-danger px-3 py-1.5 text-xs"
                    onClick={() => deleteLesson(lesson.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {expandedId === lesson.id && (
                <div className="mt-5 space-y-6 border-t border-nmcn-border pt-5">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-nmcn-muted">
                        Sections
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            "heading",
                            "paragraph",
                            "list",
                            "callout",
                            "image",
                            "youtube",
                          ] as const
                        ).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="btn-ghost px-2 py-1 text-[10px]"
                            onClick={() => addSection(lesson, t)}
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {lesson.sections.map((s, si) => (
                        <div
                          key={si}
                          className="rounded-lg border border-nmcn-border bg-nmcn-black/40 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="badge">{s.type}</span>
                            <button
                              type="button"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => removeSection(lesson, si)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {s.type === "list" ? (
                            <textarea
                              className="textarea"
                              rows={3}
                              value={(s.items || []).join("\n")}
                              onChange={(e) =>
                                updateSection(lesson, si, {
                                  items: e.target.value.split("\n"),
                                })
                              }
                            />
                          ) : s.type === "image" ? (
                            <div className="space-y-2">
                              <input
                                className="input"
                                placeholder="Image URL"
                                value={s.src || ""}
                                onChange={(e) =>
                                  updateSection(lesson, si, { src: e.target.value })
                                }
                              />
                              <input
                                className="input"
                                placeholder="Alt text"
                                value={s.alt || ""}
                                onChange={(e) =>
                                  updateSection(lesson, si, { alt: e.target.value })
                                }
                              />
                            </div>
                          ) : s.type === "youtube" ? (
                            <div className="space-y-2">
                              <input
                                className="input"
                                placeholder="YouTube URL or embed ID"
                                value={s.videoUrl || ""}
                                onChange={(e) =>
                                  updateSection(lesson, si, { videoUrl: e.target.value })
                                }
                              />
                              {s.videoUrl && (
                                <div className="aspect-video rounded-lg border border-nmcn-border bg-black overflow-hidden">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${s.videoUrl.replace(/.*(?:v=|embed\/)([\w-]{11}).*/, "$1")}`}
                                    className="h-full w-full"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <textarea
                              className="textarea"
                              rows={s.type === "heading" ? 1 : 3}
                              value={s.text || ""}
                              onChange={(e) =>
                                updateSection(lesson, si, { text: e.target.value })
                              }
                            />
                          )}
                        </div>
                      ))}
                      {lesson.sections.length === 0 && (
                        <p className="text-sm text-nmcn-muted">No sections yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-nmcn-muted">
                        Knowledge Check ({lesson.questions.length})
                      </h3>
                      <button
                        type="button"
                        className="btn-outline px-3 py-1 text-xs"
                        onClick={() => addQuestion(lesson)}
                      >
                        <Plus className="mr-1 inline h-3 w-3" /> Question
                      </button>
                    </div>
                    <div className="space-y-3">
                      {lesson.questions.map((q, qi) => (
                        <div
                          key={q.id ?? qi}
                          className="rounded-lg border border-nmcn-border bg-nmcn-black/40 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-nmcn-blue">
                              Q{qi + 1}
                            </span>
                            <button
                              type="button"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => removeQuestion(lesson, qi)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <input
                            className="input mb-2"
                            placeholder="Question prompt"
                            value={q.prompt}
                            onChange={(e) =>
                              updateQuestion(lesson, qi, { prompt: e.target.value })
                            }
                          />
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${lesson.id}-${qi}`}
                                  checked={q.correctIndex === oi}
                                  onChange={() =>
                                    updateQuestion(lesson, qi, { correctIndex: oi })
                                  }
                                  title="Mark correct"
                                />
                                <input
                                  className="input"
                                  placeholder={`Option ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const options = [...q.options];
                                    options[oi] = e.target.value;
                                    updateQuestion(lesson, qi, { options });
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn-ghost px-2 text-xs"
                                  onClick={() => {
                                    const options = q.options.filter(
                                      (_, i) => i !== oi
                                    );
                                    const correctIndex =
                                      q.correctIndex === oi
                                        ? 0
                                        : q.correctIndex > oi
                                          ? q.correctIndex - 1
                                          : q.correctIndex;
                                    updateQuestion(lesson, qi, {
                                      options,
                                      correctIndex,
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn-ghost mt-1 px-2 py-1 text-xs"
                            onClick={() =>
                              updateQuestion(lesson, qi, {
                                options: [...q.options, ""],
                              })
                            }
                          >
                            + option
                          </button>
                          <textarea
                            className="textarea mt-2"
                            rows={2}
                            placeholder="Explanation shown after answering"
                            value={q.explanation || ""}
                            onChange={(e) =>
                              updateQuestion(lesson, qi, {
                                explanation: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                      {lesson.questions.length === 0 && (
                        <p className="text-sm text-nmcn-muted">
                          No questions yet — add at least one.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-gold w-full disabled:opacity-50"
                    disabled={saving}
                    onClick={() => saveLesson(lesson)}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Lesson
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
