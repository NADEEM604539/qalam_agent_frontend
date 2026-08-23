"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchDashboard(); }, []);

  const parseMarks = (raw) => {
    // The API returns marks as a JSON string — parse it and extract sections.
    if (!raw) return [];
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;              // already sections list
      if (parsed && Array.isArray(parsed.sections)) return parsed.sections; // { sections: [...] }
      return [];
    } catch {
      return [];
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { router.push("/login"); return; }

      const res = await fetch(`${API_BASE_URL}/api/dashboard/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to fetch dashboard.");
      const data = await res.json();
      setDashboard(data);
    } catch (e) {
      setError("Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!dashboard || togglingStatus) return;
    try {
      setTogglingStatus(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) { router.push("/login"); return; }
      const newStatus = !dashboard.user.is_active;
      const res = await fetch(`${API_BASE_URL}/api/dashboard/toggle_status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const data = await res.json();
      setDashboard((prev) => ({ ...prev, user: { ...prev.user, is_active: data.is_active ?? newStatus } }));
    } catch (e) {
      setError("Unable to update monitoring status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error && !dashboard) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#dadce0] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fce8e6] text-[#d93025]">
            <AlertIcon />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-[#202124]">Something went wrong</h2>
          <p className="mt-2 text-sm text-[#5f6368]">{error}</p>
          <button onClick={fetchDashboard}
            className="mt-7 rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#1765cc] hover:shadow-md">
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  const courses = dashboard.courses || [];
  const isActive = !!dashboard.user?.is_active;

  // Parse marks string -> sections array for every course once, at the top.
  const parsedCourses = courses.map((c) => ({
    ...c,
    marks: parseMarks(c.marks),
  }));

  const allSections = parsedCourses.flatMap((c) => c.marks);
  const allTypes    = allSections.flatMap((s) => s.assessment_types || []);
  const allAssess   = allTypes.flatMap((t) => t.assessments || []);
  const totalObtained = allAssess.reduce((s, a) => s + Number(a.obtained_marks || 0), 0);
  const totalMax      = allAssess.reduce((s, a) => s + Number(a.max_mark || 0), 0);
  const globalPct     = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#202124]">
      {/* Header — Gmail-style top bar */}
      <header className="sticky top-0 z-20 border-b border-[#e0e0e0] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ea4335] shadow-sm">
              <QalamIcon />
            </div>
            <div>
              <p className="text-base font-semibold text-[#202124] leading-none">Qalam</p>
              <p className="text-[11px] text-[#5f6368]">Academic Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[220px] truncate text-sm font-medium text-[#202124]">
                {dashboard.user.email}
              </p>
              <p className="text-[11px] text-[#5f6368]">Student</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ea4335] text-xs font-bold text-white shadow-sm">
              {getInitials(dashboard.user.email)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* Page title */}
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium
              ${isActive ? "border-[#ceead6] bg-[#e6f4ea] text-[#137333]" : "border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#34a853] animate-pulse" : "bg-[#9aa0a6]"}`} />
              {isActive ? "Monitoring active" : "Monitoring paused"}
            </div>
            <h1 className="text-2xl font-semibold text-[#202124] sm:text-3xl">Your academic overview</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6368]">
              Real-time Qalam results, assessments and course performance — all in one place.
            </p>
          </div>

          {/* Monitoring toggle — proper Gmail-style button */}
          <div className="flex shrink-0 items-center justify-between gap-5 rounded-2xl border border-[#dadce0] bg-white px-5 py-4 shadow-sm sm:min-w-[300px]">
            <div>
              <p className="text-sm font-medium text-[#202124]">Marks monitoring</p>
              <p className="mt-0.5 text-xs text-[#5f6368]">
                {isActive ? "Email notifications are enabled." : "Notifications are currently paused."}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleStatus}
              disabled={togglingStatus}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  togglingStatus
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }
                ${
                  isActive
                    ? "bg-[#e6f4ea] text-[#137333] ring-[#34a853] hover:bg-[#ceead6] focus:ring-[#34a853]"
                    : "bg-[#f1f3f4] text-[#5f6368] ring-[#dadce0] hover:bg-[#e0e0e0] focus:ring-[#9aa0a6]"
                }`}
            >
              {/* Toggle track */}
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200
                  ${isActive ? "bg-[#34a853]" : "bg-[#bdc1c6]"}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
                    ${isActive ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </span>
              {togglingStatus ? "Updating..." : isActive ? "On" : "Off"}
            </button>
          </div>
        </section>

        {/* Inline error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#fad2cf] bg-[#fce8e6] px-4 py-3 text-sm text-[#d93025]">
            <AlertIcon size={16} /> {error}
          </div>
        )}

        {/* Stats — Gmail-style cards */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<BookIcon />}     label="Courses"      value={courses.length}   sub="tracked"              color="blue" />
          <StatCard icon={<AssessIcon />}   label="Assessments"  value={allAssess.length} sub="total"                color="blue" />
          <StatCard icon={<ChartIcon />}    label="Overall"
            value={globalPct !== null ? `${globalPct}%` : "—"}
            sub={`${fmt(totalObtained)} / ${fmt(totalMax)} marks`}
            color={globalPct === null ? "gray" : globalPct >= 80 ? "green" : globalPct >= 50 ? "yellow" : "red"} />
          <StatCard icon={<ActivityIcon />} label="Monitoring"
            value={isActive ? "Active" : "Paused"}
            sub={isActive ? "Emails enabled" : "Emails off"}
            color={isActive ? "green" : "gray"} />
        </section>

        {/* Email info banner */}
        <section className={`mb-8 rounded-2xl border px-5 py-4
          ${isActive ? "border-[#c5e0f5] bg-[#e8f0fe]" : "border-[#dadce0] bg-white"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                ${isActive ? "bg-[#1a73e8] text-white" : "bg-[#f1f3f4] text-[#9aa0a6]"}`}>
                <MailIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-[#202124]">
                  {isActive ? "You'll be notified of any changes" : "Email notifications are paused"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#5f6368]">
                  {isActive
                    ? "When a change in your marks is detected, we'll email you within approximately 10 minutes."
                    : "Turn monitoring back on to receive email alerts when your marks change."}
                </p>
              </div>
            </div>
            {isActive && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#c5e0f5] bg-white px-3 py-1.5 text-xs text-[#1a73e8] font-medium">
                <ClockIcon /> ~10 min
              </div>
            )}
          </div>
        </section>

        {/* Courses */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#202124]">Your courses</h2>
              <p className="mt-0.5 text-sm text-[#5f6368]">Latest marks and assessment performance.</p>
            </div>
            <span className="text-xs text-[#9aa0a6]">{parsedCourses.length} {parsedCourses.length === 1 ? "course" : "courses"} tracked</span>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dadce0] bg-white px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4] text-[#9aa0a6]">
                <BookIcon />
              </div>
              <h3 className="mt-5 text-base font-medium text-[#202124]">No courses found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#5f6368]">No courses are associated with your account yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedCourses.map((course) => <CourseCard key={course.course_id} course={course} />)}
            </div>
          )}
        </section>

        <div className="mt-10 border-t border-[#e0e0e0] pt-5 text-center">
          <p className="text-xs text-[#9aa0a6]">
            Qalam monitors your latest results every 10 minutes when monitoring is enabled.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─── Course Card ─────────────────────────────────────── */
function CourseCard({ course }) {
  const [expanded, setExpanded] = useState(true);

  const sections = Array.isArray(course.marks) ? course.marks : [];
  const contentSections = sections.filter((s) => (s.assessment_types || []).length > 0);
  const allTypes  = sections.flatMap((s) => s.assessment_types || []);
  const allAssess = allTypes.flatMap((t) => t.assessments || []);

  const totalObtained = allAssess.reduce((s, a) => s + Number(a.obtained_marks || 0), 0);
  const totalMax      = allAssess.reduce((s, a) => s + Number(a.max_mark || 0), 0);
  const pct           = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;

  const pctColor = pct === null ? "text-[#5f6368]"
    : pct >= 80 ? "text-[#137333]" : pct >= 50 ? "text-[#b06000]" : "text-[#d93025]";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-sm transition hover:shadow-md">
      {/* Course header */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {/* Colored initial block — Gmail avatar style */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ea4335] text-lg font-bold text-white shadow-sm">
              {course.course_name?.charAt(0) || "C"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">
                  {course.course_id}
                </span>
                {course.marks_updated_at && (
                  <span className="text-[11px] text-[#9aa0a6]">Updated {formatDate(course.marks_updated_at)}</span>
                )}
              </div>
              <h3 className="mt-1.5 text-base font-semibold text-[#202124]">{course.course_name}</h3>
              {course.course_teacher && (
                <p className="mt-0.5 text-sm text-[#5f6368]">{course.course_teacher}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pct !== null && (
              <div className="rounded-xl border border-[#dadce0] bg-[#f6f8fc] px-4 py-2.5 text-center">
                <p className={`text-xl font-bold ${pctColor}`}>{pct}%</p>
                <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wide font-medium">Overall</p>
              </div>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dadce0] text-[#5f6368] transition hover:bg-[#f1f3f4]">
              <ChevronIcon expanded={expanded} />
            </button>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Sections"    value={contentSections.length} />
          <Metric label="Categories"  value={allTypes.length} />
          <Metric label="Assessments" value={allAssess.length} />
          <Metric label="Marks"       value={`${fmt(totalObtained)} / ${fmt(totalMax)}`} />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#e0e0e0] bg-[#f6f8fc] p-4 sm:p-6">
          {contentSections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dadce0] bg-white px-5 py-10 text-center">
              <p className="text-sm text-[#9aa0a6]">No marks available for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contentSections.map((s, i) => <SectionBlock key={i} section={s} />)}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ─── Section Block ───────────────────────────────────── */
function SectionBlock({ section }) {
  const [open, setOpen] = useState(true);
  const types = section.assessment_types || [];

  return (
    <div className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition hover:bg-[#f1f3f4]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#202124]">{section.section_name}</p>
          <p className="mt-0.5 text-xs text-[#9aa0a6]">
            {types.length === 0 ? "No assessments" : `${types.length} ${types.length === 1 ? "category" : "categories"}`}
          </p>
        </div>
        <ChevronIcon expanded={open} />
      </button>
      {open && types.length > 0 && (
        <div className="border-t border-[#e0e0e0] p-4 sm:p-5 space-y-6">
          {types.map((t, i) => <AssessmentTypeBlock key={i} type={t} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Assessment Type Block ───────────────────────────── */
function AssessmentTypeBlock({ type }) {
  const assessments = type.assessments || [];
  const pct = Number(type.obtained_percentage || 0);

  const barColor = pct >= 80 ? "bg-[#34a853]" : pct >= 50 ? "bg-[#fbbc04]" : "bg-[#ea4335]";
  const pctColor = pct >= 80 ? "text-[#137333]" : pct >= 50 ? "text-[#b06000]" : "text-[#d93025]";

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[#202124]">{type.type}</h4>
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold text-[#1a73e8]">
              {type.weight_percent}% weight
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#9aa0a6]">
            {assessments.length} {assessments.length === 1 ? "assessment" : "assessments"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-[#e0e0e0]">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className={`min-w-[44px] text-right text-sm font-bold ${pctColor}`}>{pct}%</span>
        </div>
      </div>

      {assessments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#e0e0e0]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#f6f8fc]">
                  {["Assessment", "Score", "Class Avg.", "Performance"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#5f6368] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {assessments.map((a, i) => <AssessmentRow key={i} assessment={a} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Assessment Row ──────────────────────────────────── */
function AssessmentRow({ assessment }) {
  const pct   = Number(assessment.percentage || 0);
  const bar   = pct >= 80 ? "bg-[#34a853]" : pct >= 50 ? "bg-[#fbbc04]" : "bg-[#ea4335]";
  const text  = pct >= 80 ? "text-[#137333]" : pct >= 50 ? "text-[#b06000]" : "text-[#d93025]";

  return (
    <tr className="transition hover:bg-[#f6f8fc]">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[#202124]">{assessment.name}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-[#202124]">{fmt(assessment.obtained_marks)}</span>
        <span className="text-xs text-[#9aa0a6]"> / {fmt(assessment.max_mark)}</span>
      </td>
      <td className="px-4 py-3 text-sm text-[#5f6368]">{fmt(assessment.class_average)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e0e0e0]">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className={`text-xs font-bold ${text}`}>{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

/* ─── Stat Card ───────────────────────────────────────── */
const COLORS = {
  blue:   { bg: "bg-[#e8f0fe]", icon: "text-[#1a73e8]", val: "text-[#1a73e8]",  ring: "border-[#c5d8f5]" },
  green:  { bg: "bg-[#e6f4ea]", icon: "text-[#34a853]", val: "text-[#137333]",  ring: "border-[#ceead6]" },
  yellow: { bg: "bg-[#fef9e3]", icon: "text-[#fbbc04]", val: "text-[#b06000]",  ring: "border-[#fde68a]" },
  red:    { bg: "bg-[#fce8e6]", icon: "text-[#ea4335]", val: "text-[#d93025]",  ring: "border-[#fad2cf]" },
  gray:   { bg: "bg-[#f1f3f4]", icon: "text-[#9aa0a6]", val: "text-[#5f6368]", ring: "border-[#dadce0]" },
};

function StatCard({ label, value, sub, icon, color = "blue" }) {
  const c = COLORS[color] || COLORS.blue;
  return (
    <div className={`rounded-2xl border ${c.ring} bg-white p-5 shadow-sm`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.icon}`}>{icon}</div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#9aa0a6]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${c.val}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-[#9aa0a6]">{sub}</p>
    </div>
  );
}

/* ─── Metric ──────────────────────────────────────────── */
function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f1f3f4] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa0a6]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#202124]">{value}</p>
    </div>
  );
}

/* ─── Loading ─────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-4 w-28 rounded-full bg-[#e0e0e0]" />
          <div className="h-8 w-72 rounded-xl bg-[#e0e0e0]" />
          <div className="h-4 w-96 max-w-full rounded-full bg-[#e0e0e0]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e0e0e0]" />)}
          </div>
          <div className="h-20 rounded-2xl bg-[#e0e0e0]" />
          <div className="h-72 rounded-2xl bg-[#e0e0e0]" />
        </div>
      </div>
    </main>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function fmt(val) {
  const n = Number(val ?? 0);
  return Number.isInteger(n) ? n : +n.toFixed(2);
}
function formatDate(d) {
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}
function getInitials(email = "") {
  return email.split("@")[0].split(/[._-]/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

/* ─── Icons ───────────────────────────────────────────── */
function QalamIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 6h8"/><path d="M8 10h5"/></svg>;
}
function BookIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>;
}
function MailIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
}
function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}
function ActivityIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>;
}
function AlertIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
}
function ChartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/></svg>;
}
function AssessIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function ChevronIcon({ expanded }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>;
}
